import mongoose,{isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req?.user?._id;
    if(!channelId){
        throw new ApiError(401, "ChannelId is missing");
    }
    if(!userId){
        throw new ApiError(401,"User is not Logged In");
    }
    // check if channel is valid
    const channelDetail = await User.findById(channelId);
    if(!channelDetail){
        throw new ApiError(404,"Channel not Found");
    }
    // check if user is already subscribed
    const isSubscribed = await Subscription.findOne(
        {
            $and: [
                {
                    subscriber: userId
                },
                {
                    channel: channelId
                }
            ]
        }
    );
    if(isSubscribed){
        await Subscription.deleteOne(
            {
                $and: [
                    {
                        subscriber: userId
                    },
                    {
                        channel: channelId
                    }
                ]
            }
        );
        return res.status(200).json({
            userId,
            channelId,
            message: "Unsubscribed"
        });
    }

    // adding new Subscriber
    const subscriber = await Subscription.create({
        subscriber: userId,
        channel: channelId
    });
    if(!subscriber){
        throw new ApiError(401,"Something went wrong while subscribing");
    }
    return res.status(200).json(new ApiResponse(200,subscriber));

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(401,"Channel Id is Missing");
    }
    
    const subscriberList = await Subscription.aggregate(
        [
            {
              '$match': {
                'channel': new mongoose.Types.ObjectId(String(channelId))
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'subscriber', 
                'foreignField': '_id', 
                'as': 'SubscriberList', 
                'pipeline': [
                  {
                    '$project': {
                      'fullName': 1, 
                      'username': 1, 
                      'avatar': 1
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'subscriber': {
                  '$first': '$SubscriberList'
                }
              }
            }, {
              '$project': {
                'SubscriberList': 0
              }
            }, {
              '$group': {
                '_id': '$channel', 
                'subscriber': {
                  '$push': '$subscriber'
                }
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': '_id', 
                'foreignField': '_id', 
                'as': 'ChannelDetails', 
                'pipeline': [
                  {
                    '$project': {
                      'fullName': 1, 
                      'username': 1, 
                      'avatar': 1
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'ChannelDetails': {
                  '$first': '$ChannelDetails'
                }
              }
            }
          ]
    );

    if(!subscriberList.length){
        throw new ApiError(401,"No Subscribers Found")
    }
    return res.status(200).json(new ApiResponse(200,subscriberList[0]));


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(401,"Subscriber Id is Missing")
    }
    const channelList = await Subscription.aggregate(
        [
            {
              '$match': {
                'subscriber': new mongoose.Types.ObjectId(String(subscriberId))
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'channel', 
                'foreignField': '_id', 
                'as': 'ChannelList', 
                'pipeline': [
                  {
                    '$project': {
                      'fullName': 1, 
                      'username': 1, 
                      'avatar': 1
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'channels': {
                  '$first': '$ChannelList'
                }
              }
            }, {
              '$project': {
                'ChannelList': 0
              }
            }, {
              '$group': {
                '_id': '$subscriber', 
                'channels': {
                  '$push': '$channels'
                }
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': '_id', 
                'foreignField': '_id', 
                'as': 'SubscriberDetails', 
                'pipeline': [
                  {
                    '$project': {
                      'fullName': 1, 
                      'username': 1, 
                      'avatar': 1
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'SubscriberDetails': {
                  '$first': '$SubscriberDetails'
                }
              }
            }
          ]
    );

    if(!channelList.length){
        throw new ApiError(401,"No Channels Found")
    }
    return res.status(200).json(new ApiResponse(200,channelList[0]));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}