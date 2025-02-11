import { Types as MongooseTypes, Types } from "mongoose";

export interface PermissionProp {
  module: string;
  actions: string[];
}

export interface RoleProp {
  name: string;
  permissions: PermissionProp[];
}

export interface ProductProp {
  _id?: MongooseTypes.ObjectId;
  name: string;
  createdBy: MongooseTypes.ObjectId;
  description?: string;
  brand: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  discount?: number;
  category?: MongooseTypes.ObjectId;
  images: string[];
  stock: number;
  status?: "active" | "inactive" | "archived";
  tags?: string[];
  modelNo: string;
  serialNo?: string;
  condition: "new" | "used" | "refurbished";
  manufactureDate: Date;
  warranty?: {
    duration?: number; // in days
    description?: string;
  };
  baseImage?: {
    small?: string;
    medium?: string;
    full?: string;
  };
  keyFeatures?: string[];
  minimumOrderQuantity?: number;
  dimensions?: {
    width?: number;
    height?: number;
    length?: number;
    unit?: "cm" | "inch" | "m";
  };
  weight?: {
    value?: number;
    unit?: "kg" | "g" | "lb";
  };
  variants?: MongooseTypes.ObjectId[];
  seo?: {
    slug?: string;
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface Image {
  small?: string;
  medium?: string;
  full?: string;
}

export interface PartProp {
  name: string;
  description?: string;
  brand: string;
  discount: number;
  image?: Image;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  tags?: string[];
  modelNo: string;
  serialNo?: string;
  status: "active" | "inactive" | "archived";
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
