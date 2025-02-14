//helper function to replace placeholders in the message template

import axios from "axios";

export function replacePlaceholders(template: string, data: any) {
  const regex = /{{(.*?)}}/g;

  const placeholderMapping = {
    customer_name: "customer.name",
    customer_phone_no: "customer.phoneNo",
    service_name: "service.name",
    order_id: "orderId",
  };

  return template.replace(regex, (match, key) => {
    //@ts-ignore
    const mappedKey = placeholderMapping[key.trim()] || key.trim();
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
