import * as cron from "cron";
import nodemailer from "nodemailer";
import serviceOrderModel from "./api/v1/service/serviceOrder/serviceOrder.model";
import { readConfig } from "./utils/config.utils";
import axios from "axios";
import templateModel from "./api/v1/template/template.model";
import {
  replacePlaceholders,
  sendServiceOrderSms,
  sendSms,
} from "./utils/template.util";

const template =
  "Hello {{customer.name}}. This is to notify you that you have a service order for {{orderId}} today.";

const OrderSmsTemplateId = "67ac6e2be7dca55eccb4e91a";
// const orderEmail = "67ac6e2be7dca55eccb4e91a";

//read notification time from business config
const configHour =
  readConfig("business").notifications?.upcommingOrder?.notificationTime?.hour;
const configMinute =
  readConfig("business").notifications?.upcommingOrder?.notificationTime
    ?.minute;
const configDaysBefore =
  readConfig("business").notifications?.upcommingOrder?.daysBefore;

const notificationTimeHour =
  configHour > 0 ? (configHour < 24 ? configHour : "9") : "9";
const notificationTimeMinute =
  configMinute > 0 ? (configMinute <= 59 ? configMinute : "00") : "00";

//setup email
const transporter = nodemailer.createTransport({
  host: "mail.bizzsoftw.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("Env", process.env.EMAIL_USER, process.env.EMAIL_PASS);

transporter.verify((error, success) => {
  if (error) {
    console.log("Email Transporter Error:", error.message);
  } else {
    console.log("Server is ready to send emails");
  }
});

const sendEmail = async (to: string, subject: string, text: string) => {
  console.log(to, subject, text);
  try {
    const info = await transporter.sendMail({
      from: `"Company"`,
      to,
      subject,
      text,
    });
    console.log("Email sent:", info.messageId);
  } catch (error: any) {
    console.log("Error sending email:", error);
  }
};

export const runCronJobs = async () => {
  console.log("running cron jobs");
  new cron.CronJob(
    `0 ${notificationTimeMinute} ${notificationTimeHour} * * * `,
    async () => {
      sendTodaysOrders();
      sendUpcommingOrders();
    },
    null,
    true,
    "Asia/Kathmandu"
  );
};

async function sendTodaysOrders() {
  try {
    // Fetch all orders whose next Service date is today along with customer details.
    const response = await serviceOrderModel
      .find({
        date: new Date().toISOString().split("T")[0],
      })
      .populate({
        path: "customer",
        populate: { path: "user", select: "email" },
      })
      .populate({ path: "service", select: "title serviceCharge" });

    // get phone numbers of the customer.
    const todaysOrder: any = response.map((order) => {
      const plainOrder = order.toObject();
      if (plainOrder.date) {
        plainOrder.date = new Date(plainOrder.date)
          .toISOString()
          .split("T")[0] as any;
      }
      return plainOrder;
    });

    const sentPhoneNumbers = new Set();

    const orderSms = await templateModel.findById(OrderSmsTemplateId);

    if (!orderSms) {
      console.error("OrderSMS template not found");
    }

    const orderSmsTemplate = orderSms?.body || template;

    todaysOrder.forEach((order: any) => {
      sendServiceOrderSms(order);
      // const phoneNo = order.customer?.phoneNo || "";

      // if (phoneNo && !sentPhoneNumbers.has(phoneNo)) {
      //   sentPhoneNumbers.add(phoneNo);

      //   const message = replacePlaceholders(orderSmsTemplate, order);

      //   const customerEmail = order.customer?.user?.email;

      //   // sendSms(phoneNo, message);
      //   if (customerEmail) {
      //     // sendEmail(customerEmail, "Service Order Notification", message);
      //   }
      // }
    });
  } catch (error) {
    console.log("Error sending todays order", error);
  }
}

async function sendUpcommingOrders() {
  const upcommingDay = new Date();
  upcommingDay.setDate(upcommingDay.getDate() + configDaysBefore);

  const response = await serviceOrderModel
    .find({
      date: upcommingDay,
    })
    .populate("customer");

  // get phone numbers of the customer.
  const upcommingOrder: any = response.map((order) => {
    const plainOrder = order.toObject();
    if (plainOrder.date) {
      plainOrder.date = new Date(plainOrder.date)
        .toISOString()
        .split("T")[0] as any;
    }
    return plainOrder;
  });
  const phoneNumbers = upcommingOrder
    .map((order: any) => order.customer?.phoneNo)
    .filter((phoneNo: string) => phoneNo !== undefined);
  console.log(phoneNumbers);

  upcommingOrder.forEach((order: any) => {
    console.log("Sending Message to :", order.customer?.phoneNo || "No phone");
    const sms_message = replacePlaceholders(template, order);
    console.log(sms_message);
    const phoneNo = order.customer?.phoneNo || "";
    if (phoneNo) {
      // sendSms(phoneNo, sms_message);
      console.log("send message to", phoneNo);
    }
  });
}

// sendTodaysOrders();
// sendUpcommingOrders();
