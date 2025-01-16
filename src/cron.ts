import * as cron from "cron";
import serviceOrderModel from "./api/v1/service/serviceOrder/serviceOrder.model";
import { getConfigValue, readConfig } from "./utils/config.utils";

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

export const runCronJobs = async () => {
  console.log("running cron jobs");

  //read notification time from business config
  const configHour =
    readConfig("business").notifications?.upcommingOrder?.notificationTime
      ?.hour;
  const configMinute =
    readConfig("business").notifications?.upcommingOrder?.notificationTime
      ?.minute;

  const notificationTimeHour =
    configHour > 0 ? (configHour < 24 ? configHour : "9") : "9";
  const notificationTimeMinute =
    configMinute > 0 ? (configMinute <= 59 ? configMinute : "00") : "00";

  // initialize cron job each day
  new cron.CronJob(
    `0 ${notificationTimeMinute} ${notificationTimeHour} * * * `, // time to send notification taken from business config
    async () => {
      // Fetch all orders whose next Service date is today along with customer details.
      const response = await serviceOrderModel
        .find({
          date: new Date().toISOString().split("T")[0],
        })
        .populate("customer");

      // get phone numbers of the customer.
      const todaysOrder: any = response.map((order) => order.toObject());
      const phoneNumbers = todaysOrder.map(
        (order: any) => order.customer?.phoneNo
      );
      console.log(phoneNumbers);

      // send message/mail to all the customer

      const template =
        "Hello {{customer.name}}. This is to notify you that you have a service order for {{orderId}} at {{date}}.";
      todaysOrder.forEach((order: any) => {
        console.log(
          "Sending Message to :",
          order.customer?.phoneNo || "No phone"
        );
        const sms_message = replacePlaceholders(template, order, "Customer");
        console.log(sms_message);
      });
    },
    null,
    true,
    "Asia/Kathmandu" // Optional: Timezone
  );

  //send notificaction to employee
  new cron.CronJob(
    "0 0 9 * * *", // everyday at 9am
    async () => {
      // Fetch all orders whose next Service date is today along with employee details.
      // get phone numbers of the employee.
      // send message/mail to all the employee
    },
    null,
    true,
    "Asia/Kathmandu" // Optional: Timezone
  );
};
