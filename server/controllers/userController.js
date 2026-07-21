import { clerkClient } from "@clerk/express";
import Movie from "../models/Movie.js";
import Booking from "../models/Booking.js";


// api to get user bookings
export const getUserBookings = async(req, res) => {
    try {
        const user = req.auth().userId;
        const bookings = await Booking.find({user}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({createdAt: -1})

        res.json({success: true, bookings})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}


// api to addfavourite movie in clerk user metadata
export const addFavourite = async(req, res) => {
    try {
        const {movieId} =req.body ;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId);

        if(!user.privateMetadata.favourites){
            user.privateMetadata.favourites = []
        }
        
        if(!user.privateMetadata.favourites.includes(movieId)){
            user>privateMetadata.favourites.push(movieId)
        }

        await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata})

        res.json({success: true, message: "Favourites added successfully"})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// api to update favourite movie in clerk user metadata
export const updateFavourite = async(req, res) => {
    try {
        const {movieId} =req.body ;
        const userId = req.auth().userId;

        const user = await clerkClient.users.getUser(userId);

        if(!user.privateMetadata.favourites){
            user.privateMetadata.favourites = []
        }
        
        if(!user.privateMetadata.favourites.includes(movieId)){
            user.privateMetadata.favourites.push(movieId)
        } else {
            user.privateMetadata.favourites = user.privateMetadata.favourites.filter(item => item !== movieId)
        }

        await clerkClient.users.updateUserMetadata(userId, {privateMetadata: user.privateMetadata})

        res.json({success: true, message: "Favourites movies updated"})

    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}

// list to get favourite movies
export const getFavourites = async (req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.auth().userId)
        const favourites = user.privateMetadata.favourites

        //getting movies from database
        const movies = await Movie.find({ _id: { $in: favourites}})

        res.json({success: true, movies})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message})
    }
}