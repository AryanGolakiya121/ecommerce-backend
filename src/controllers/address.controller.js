import mongoose from "mongoose";
import Address from "../models/Address.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const addAddress = async(req, res, next) => {
    try {
        const {
            fullName,
            phone,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            country,
            postalCode,
            landmark,
            addressType,
            isDefault
        } = req.body;

        // If this address should be default 
        // Remove default status from  user's existing address
        if(isDefault) {
            await Address.updateMany(
                {
                    userId: req.user?._id,
                    isDefault: true
                },
                {
                    $set: {
                        isDefault: false
                    }
                }
            );
        };

        const address = await Address.create({
            userId: req.user?._id,
            fullName,
            phone,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            country,
            postalCode,
            landmark,
            addressType,
            isDefault
        })

        return ApiResponse(res, 201, "Address added successfully", address)
    } catch (error) {
        console.log("Error in addAddress:",error);
        next(error);
    }
}

export const getAllAddresses = async(req, res, next) => {
    try {
        const addresses = await Address.find({ userId: req.user._id }).select("-__v").sort({ isDefault: -1, createdAt: -1});

        return ApiResponse(res, 200, "Address fetched successfully", addresses)
    } catch (error) {
        console.log("Error while fetching addresses:",error)
        next(error);
    }
}

export const getAddressById = async(req, res, next) => {
    try {
        const { id } = req.params;

        const address = await Address.findOne({ _id: id, userId: req.user._id }).select("-__v").lean();

        if(!address) {
            throw new ApiError(404, "Address not found")
        }
        return ApiResponse(res, 200, "Address fetched successfully", address);
    } catch (error) {
        console.log("Error while getAddressById");
        next(error);
    }
}

export const updateAddress = async(req, res, next) => {
    try {
        const { addressId, ...updateData } = req.body;

        if(!addressId) {
            throw new ApiError(400, "Address id is required");
        }

        if(!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new ApiError(400, "Address id is not valid")
        }

        const address = await Address.findOne({ _id: addressId, userId: req.user._id }).select("-__v");
        console.log("address:",address);
        

        if(!address) {
            throw new ApiError(404, "Address not found")
        };

        // If address is being made default,
        // remove default status from other address of that same user
        if(updateData.isDefault === true) {
            await Address.updateMany(
                {
                    userId: req.user._id,
                    _id: { $ne : addressId },
                    isDefault: true
                },
                {
                    $set: {
                        isDefault: false
                    }
                }
            )
        }

        Object.assign(address, updateData);
        await address.save();

        return ApiResponse(res, 200, "Address updated successfully", address);
    } catch (error) {
        console.log("Error while updating address:",error);
        next(error);
    }
}

export const setDefaultAddress = async(req, res, next) => {
    try {
        const { addressId } = req.body;
        const userId = req.user._id;

         if(!addressId) {
            throw new ApiError(400, "Address id is required");
        }

        if(!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new ApiError(400, "Address id is not valid")
        }
        const address = await Address.findOne({ _id: addressId, userId }).select("-__v");

        if(!address) {
            throw new ApiError(404, "Address not found");
        }

        if(address.isDefault) {
            return ApiResponse(res, 200, "Address is already the default address", address)
        }
        // Remove default status from other address of same user;
        await Address.updateMany(
            {
                userId,
                _id: { $ne: addressId },
                isDefault: true
            },
            {
                $set: {
                    isDefault: false
                }
            }
        );

        // Make selected address default
        address.isDefault = true

        await address.save();

        return ApiResponse(res, 200, "Default address updated successfully", address)
    } catch (error) {
        console.log("Error while set default address:",error);
        next(error);
    }
}

export const deleteAddress = async(req, res, next) => {
    try {
        const { addressId } = req.body;

         if(!addressId) {
            throw new ApiError(400, "Address id is required");
        }

        if(!mongoose.Types.ObjectId.isValid(addressId)) {
            throw new ApiError(400, "Address id is not valid")
        }

        const address = await Address.findOne({ _id: addressId, userId: req.user._id });

        if(!address) {
            throw new ApiError(404, "Address not found")
        }

        await Address.deleteOne({ _id: addressId })

        return ApiResponse(res, 200, "Address deleted successfully", null)
    } catch (error) {
        console.log("Error while deletingAddress:",error);
        next(error);
    }
}