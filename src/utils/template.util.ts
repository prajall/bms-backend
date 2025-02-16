//helper function to replace placeholders in the message template

import axios from "axios";
import templateModel from "../api/v1/template/template.model";
import mongoose from "mongoose";
import serviceOrderModel from "../api/v1/service/serviceOrder/serviceOrder.model";
import { sendEmail } from "../cron";

export function replacePlaceholders(template: string, data: any) {
  const regex = /{{(.*?)}}/g;

  const serviceOrderplaceholderMapping = {
    customer_name: "customer.name",
    customer_phone_no: "customer.phoneNo",
    service_name: "service.title",
    order_id: "orderId",
    service_charge: "serviceCharge",
    date: "date",
  };

  return template.replace(regex, (match, key) => {
    //@ts-ignore
    const mappedKey = serviceOrderplaceholderMapping[key.trim()] || key.trim();
    const value = mappedKey
      .split(".")
      .reduce((obj: any, prop: string) => (obj ? obj[prop] : undefined), data);

    return value !== undefined && value !== null ? value : match;
  });
}

export const sendSms = async (phoneNo: string, message: string) => {
  try {
    console.log("Message sending to", phoneNo, ":", message);
    const sentMessage = await axios.post("http://api.sparrowsms.com/v2/sms", {
      token: process.env.SMS_TOKEN,
      from: "InfoAlert",
      to: phoneNo,
      text: message,
    });
    console.log("Message sent", sentMessage.data);
  } catch (error: any) {
    console.log("Error sending message", error);
  }
};

export const sendServiceOrderSms = async (serviceOrder: any) => {
  try {
    const templateId = "67ac6e2be7dca55eccb4e91a";

    const template = await templateModel.findById(templateId);

    if (!template) {
      return false;
    }

    if (serviceOrder.customer?.phoneNo) {
      const message = replacePlaceholders(template.body, serviceOrder);

      const customerEmail = serviceOrder.customer?.user?.email;

      console.log("Service confirmed: ", message);
      // sendSms(serviceOrder.customer?.phoneNo, message);
      if (customerEmail) {
        sendEmail(customerEmail, "Service Order Notification", message);
      }
    }
  } catch (error: any) {
    console.error("Error fetching template:", error.message);

    return false;
    // return res
    //   .status(500)
    //   .json({ success: false, message: "Internal server error" });
  }
};
