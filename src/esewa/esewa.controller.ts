import { Request, Response } from "express";
import crypto from "crypto";

export const initiatePayment = async (req: Request, res: Response) => {
  const { amount, transactionId } = req.body;
  const productCode = "EPAYTEST"; 
  const successUrl = "http://localhost:3000/success";
  const failureUrl = "http://localhost:3000/failure";
  const secretKey = "8gBm/:&EnhH.1/q"; 

  const data = `total_amount=${amount},transaction_uuid=${transactionId},product_code=${productCode}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("base64");

  const paymentData = {
    amount,
    transaction_uuid: transactionId,
    product_code: productCode,
    success_url: successUrl,
    failure_url: failureUrl,
    signature,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    product_service_charge: 0,
    product_delivery_charge: 0,
    tax_amount: 0,
    total_amount: amount,
  };

  res.json({ paymentData });
};


