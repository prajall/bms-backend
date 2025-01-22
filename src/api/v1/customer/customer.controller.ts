import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Customer from "./customer.model";
import { apiResponse, apiError } from "../../../utils/response.util";
import mongoose, { PipelineStage } from "mongoose";
import { User } from "../user/user.model";
import { uploadOnCloudinary } from "../../../utils/cloudinary.util";

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const image = req.file;

    console.log("body:", req.body);

    const userExist = await User.findOne({ email });
    if (userExist) {
      return apiError(res, 409, "Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let imageUrl = "";
    if (image && image.size > 500000) {
      return apiError(res, 400, "Image size should be less than 500KB");
    }
    if (image) {
      const response = await uploadOnCloudinary(image.path);
      console.log("Cloudinary response:", response);
      if (response) {
        imageUrl = response.secure_url;
      }
    }

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
      image: imageUrl,
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
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const match: any = {};

    // Add search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      match.$or = [
        { "user.email": searchRegex },
        { "user.name": searchRegex },
        { "user.phoneNo": searchRegex },
        { name: searchRegex },
        { phoneNo: searchRegex },
      ];
    }

    // Aggregation pipeline
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          "user.password": 0,
          "user.createdAt": 0,
          "user.updatedAt": 0,
        },
      },

      // Apply the search filter
      { $match: match },

      // Use $facet for pagination and total count
      {
        $facet: {
          data: [
            { $sort: { [sortField]: sortOrder } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    // Execute the aggregation pipeline
    const results = await Customer.aggregate(pipeline);

    const customers = results[0]?.data || [];
    const totalCustomers = results[0]?.totalCount[0]?.count || 0;

    return apiResponse(res, 200, "Customers retrieved successfully", {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCustomers / limit),
        totalCustomers,
        limit,
      },
      customers,
    });
  } catch (error: any) {
    console.error("Get all customers error:", error);
    return apiError(res, 500, "Failed to fetch customers", error.message);
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
      const user: any = customer.user;

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
