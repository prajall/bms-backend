import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Customer from "./customer.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import mongoose from "mongoose";
import { User } from "../user/user.model";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log("body:", req.body);

    const userExist = await User.findOne({ email });
    if (userExist) {
      return apiError(res, 409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const createdUser = await User.create({
      email,
      password: hashedPassword,
      type: "customer",
    });

    if (!createdUser) {
      return apiError(res, 500, "Failed to create user");
    }

    const customer = await Customer.create({
      user: createdUser._id,
      name: req.body.name,
      image: req.body.image,
      gender: req.body.gender,
      address: {
        country: req.body.address.country,
        province: req.body.address.province,
        city: req.body.address.city,
        addressLine: req.body.address.addressLine,
        houseNo: req.body.address.houseNo,
      },
      phoneNo: req.body.phoneNo,
      mobileNo1: req.body.mobileNo1,
      mobileNo2: req.body.mobileNo2,
    });

    if (!customer) {
      return apiError(res, 500, "Failed to create customer");
    }

    return apiResponse(res, 201, "Customer created successfully", customer);
  } catch (error) {
    console.error("Create customer error:", error);
    return apiError(res, 500, "Internal server error", error);
  }
};

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;
    const search = (req.query.search as string) || ""; // Get the search query

    const skip = (page - 1) * limit;

    // Build the filter based on search
    const filter = search
      ? {
          name: { $regex: search, $options: "i" }, // Case-insensitive regex search on name
        }
      : {};

    // Get the total count of customers matching the search
    const totalCustomers = await Customer.countDocuments(filter);
    const totalPages = Math.ceil(totalCustomers / limit);

    // Fetch the customers with pagination and search
    const customers = await Customer.find(filter)
      .populate({
        path: "user",
        select: "email password",
      })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    return apiResponse(res, 200, "Customers retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages,
        totalCustomers,
        limit,
      },
      customers,
    });
  } catch (error) {
    console.error("Get all customers error:", error);
    return apiError(res, 500, "Failed to fetch customers", error);
  }
};

export const getAllCustomerList = async (req: Request, res: Response) => {
  try {
    // Fetch all customers, selecting only the _id and name fields
    const customers = await Customer.find({}, "_id name");

    return apiResponse(res, 200, "Customer names retrieved successfully", {
      customers,
    });
  } catch (error) {
    console.error("Get all customer names error:", error);
    return apiError(res, 500, "Failed to fetch customer names", error);
  }
};


export const getCustomerDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid customer ID format");
    }

    const customer = await Customer.findById(id).populate({
        path: "user",
        select: "email password",
      });

    if (!customer) {
      return apiError(res, 404, "Customer not found");
    }

    return apiResponse(res, 200, "Customer retrieved successfully", customer);
  } catch (error) {
    console.error("Get customer by ID error:", error);
    return apiError(res, 500, "Internal Server Error", error);
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, password, ...customerUpdates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid customer ID format");
    }

    const customer = await Customer.findById(id).populate("user");
    if (!customer) {
      return apiError(res, 404, "Customer not found");
    }

    if (email || password) {
      const user:any = customer.user;

      // Check if email is unique
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return apiError(res, 409, "Email already exists");
        }
        user.email = email;
      }

      // Check if password is provided and different
      if (password) {
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (!isSamePassword) {
          user.password = await bcrypt.hash(password, 10);
        }
      }
      user.type = "customer";

      // Save the updated user
      await user.save();
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      return apiError(res, 500, "Failed to update customer");
    }

    return apiResponse(
      res,
      200,
      "Customer updated successfully",
      updatedCustomer
    );
  } catch (error) {
    console.error("Update customer error:", error);
    return apiError(res, 500, "Failed to update customer", error);
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiError(res, 400, "Invalid customer ID format");
    }

    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return apiError(res, 404, "Customer not found");
    }

    return apiResponse(res, 200, "Customer deleted successfully");
  } catch (error) {
    console.error("Delete customer error:", error);
    return apiError(res, 500, "Failed to delete customer", error);
  }
};
