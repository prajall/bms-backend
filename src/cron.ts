import * as cron from "cron";
import nodemailer from "nodemailer";
import serviceOrderModel from "./api/v1/service/serviceOrder/serviceOrder.model";
import { readConfig } from "./utils/config.utils";
import axios from "axios";

const template =
  "Hello {{customer.name}}. This is to notify you that you have a service order for {{orderId}} today.";
const OrderSmsId = "67ac6e2be7dca55eccb4e91a";
const orderEmail = "67ac6e2be7dca55eccb4e91a";
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

//helper function to replace placeholders in the message template
function replacePlaceholders(template: string, data: any, fallback: string) {
  const regex = /{{(.*?)}}/g;

  return template.replace(regex, (match, key) => {
    const value = key
      .trim()
      .split(".")
      .reduce(
        (obj: string, prop: number) => (obj ? obj[prop] : undefined),
        data
      );
    return value !== undefined && value !== null ? value : fallback;
  });
}

//send sms with sparrowsms api
const sendSms = async (phoneNo: string, message: string) => {
  try {
    const sentMessage = await axios.post("http://api.sparrowsms.com/v2/sms", {
      token: process.env.SMS_TOKEN,
      from: "InfoAlert",
      to: phoneNo,
      text: message,
    });
    console.log("Message sent", sentMessage.data);
  } catch (error: any) {
    console.log("Error sending message", error.message);
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter Error:", error.message);
  } else {
    console.log("Server is ready to send emails");
  }
});

// Helper function to send email
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

// Run cron jobs
export const runCronJobs = async () => {
  console.log("running cron jobs");

  new cron.CronJob(
    // Daily time to send notification taken from business config
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
  // Fetch all orders whose next Service date is today along with customer details.
  const response = await serviceOrderModel
    .find({
      date: new Date().toISOString().split("T")[0],
    })
    .populate({ path: "customer", populate: "user", select: "-password" });

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

  console.log("Today's Order", todaysOrder);

  const sentPhoneNumbers = new Set();

  // send message/mail to all the customer
  todaysOrder.forEach((order: any) => {
    const phoneNo = order.customer?.phoneNo || "";

    if (phoneNo && !sentPhoneNumbers.has(phoneNo)) {
      sentPhoneNumbers.add(phoneNo);

      const message = replacePlaceholders(template, order, "Customer");
      console.log("Sending Message to:", phoneNo);
      console.log(message);

      const customerEmail = order.customer?.user?.email;

      // sendSms(phoneNo, message);
      if (customerEmail) {
        // sendEmail(customerEmail, "Service Order Notification", message);
      }
    }
  });
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
    const sms_message = replacePlaceholders(template, order, "Customer");
    console.log(sms_message);
    const phoneNo = order.customer?.phoneNo || "";
    if (phoneNo) {
      // sendSms(phoneNo, sms_message);
      console.log("send message to", phoneNo);
    }
  });
}

sendTodaysOrders();
// sendUpcommingOrders();
