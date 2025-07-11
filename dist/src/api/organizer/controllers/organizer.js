"use strict";
/**
 * organizer controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController("api::organizer.organizer", ({ strapi }) => ({
    async registerOrganizer(ctx) {
        try {
            // Destructure the fields directly from the request body
            const { firstName, lastName, email, password, confirmPassword, role } = ctx.request.body;
            console.log("l", ctx.request.body);
            // Validation (optional)
            if (!firstName || !lastName || !email || !password) {
                return ctx.badRequest("Missing required fields.");
            }
            //Check if the passwords match
            if (password !== confirmPassword) {
                return ctx.badRequest("Passwords do not match.");
            }
            // Check if the organizer already exists by email
            const existingOrganizer = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                where: { email: email },
            });
            if (existingOrganizer) {
                return ctx.badRequest("Organizer with this email already exists.");
            }
            // Create the new organizer
            const fullName = `${firstName} ${lastName}`;
            let newOrganizer;
            const newUser = await strapi.entityService.create("plugin::users-permissions.user", {
                data: {
                    email: email,
                    password: password, // Ensure the password is hashed automatically by Strapi
                    username: fullName,
                    confirmed: true,
                    blocked: false,
                    type: "organizer",
                },
            });
            newOrganizer = await strapi.entityService.create("api::organizer.organizer", {
                data: {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    userId: newUser.id,
                },
            });
            await strapi.entityService.update("plugin::users-permissions.user", newUser.id, {
                data: {
                    organizerId: newOrganizer.id, // Add the organizer ID to the user
                },
            });
            // Return the new organizer (without password)
            ctx.send({
                message: "Organizer registered successfully!",
                organizer: {
                    firstName: newOrganizer.firstName,
                    lastName: newOrganizer.lastName,
                    email: newOrganizer.email,
                },
                user: {
                    username: newUser.username,
                    email: newUser.email,
                },
            });
        }
        catch (error) {
            console.error("Error during registration:", error);
            ctx.internalServerError("Something went wrong while registering the organizer.");
        }
    },
    async loginUser(ctx) {
        const { email, password } = ctx.request.body;
        console.log("payload", ctx.request.body);
        console.log("Request Body:", ctx.request.body); // Log the request to inspect the data
        // Step 1: Fetch user by username or email
        let user;
        try {
            user = await strapi.query("plugin::users-permissions.user").findOne({
                where: {
                    $or: [
                        { email }, // Check by username
                        { email: email }, // Or check by email
                    ],
                },
            });
        }
        catch (err) {
            // console.error("Error fetching user:", err);
            return ctx.badRequest("Error fetching user.");
        }
        if (!user) {
            return ctx.badRequest("Invalid credentials");
        }
        if (!user.confirmed || user.blocked) {
            return ctx.internalServerError("Account not approved yet");
        }
        try {
            const validPassword = await strapi.plugins["users-permissions"].services.user.validatePassword(password, user.password);
            if (!validPassword) {
                // Password doesn't match
                return ctx.badRequest("Invalid credentials");
            }
            const completeUser = await strapi.entityService.findOne("plugin::users-permissions.user", user.id, // User ID
            {
                populate: "*", // Populate all fields and relations (use specific fields for better performance)
            });
            return ctx.send({
                message: "Login successful",
                user: completeUser,
            });
        }
        catch (err) {
            console.error("Error during password validation:", err);
            return ctx.internalServerError("Error during password validation.");
        }
    },
    async updateCoachStatus(ctx) {
        const { coachId, coachStatus } = ctx.request.body;
        console.log("Request Body:", ctx.request.body); // Log the request to inspect the data
        let user;
        try {
            const coach = await strapi.entityService.findOne("api::coach.coach", coachId, {
                populate: "*", // Populate the related user
            });
            console.log("coachh", coach);
            // 1. If coach not found
            if (!coach) {
                return ctx.notFound("Coach not found");
            }
            // 2. Update the coach's status
            const updatedCoach = await strapi.entityService.update("api::coach.coach", coachId, {
                data: {
                    coachStatus: coachStatus,
                },
                populate: {
                    userId: true,
                },
            });
            const linkedUser = updatedCoach.userId;
            // 3. If coach has a related user, update user's confirmed & blocked status
            if (linkedUser) {
                const userId = linkedUser.id;
                // Example logic: approve = confirm user, reject = block user
                let userUpdates = {};
                if (coachStatus === "approved") {
                    await strapi.entityService.update("plugin::users-permissions.user", userId, {
                        data: {
                            confirmed: true,
                            blocked: false,
                        },
                    });
                }
                else if (coachStatus === "rejected") {
                    await strapi.entityService.update("plugin::users-permissions.user", userId, {
                        data: {
                            confirmed: false,
                            blocked: true,
                        },
                    });
                }
            }
            ctx.send({
                message: "Coach and user updated successfully",
                coach: updatedCoach,
            });
            return ctx.send({
                message: "Login successful",
                updatedCoach: updatedCoach,
            });
        }
        catch (err) {
            console.error("Error during updating status:", err);
            return ctx.internalServerError("Error during updating status.");
        }
    },
    async addNewEvent(ctx) {
        try {
            const { eventName, startDate, endDate, organizer, venues } = ctx.request.body;
            if (!Array.isArray(venues)) {
                return ctx.badRequest("Venues must be an array of strings.");
            }
            // Log the incoming payload to the console (for debugging purposes)
            console.log("payload", ctx.request.body);
            // Creating the new event using Strapi's entity service
            const newEvent = await strapi.entityService.create("api::event.event", {
                data: {
                    eventName: eventName,
                    startDate: startDate,
                    endDate: endDate,
                    organizer: organizer,
                    venues: venues,
                },
            });
            // Sending a success response
            return ctx.send({
                message: "Event created successfully",
                data: newEvent,
            });
        }
        catch (error) {
            // Log the error for debugging
            console.error("Error creating event:", error);
            // Sending an error response
            return ctx.send({
                message: "Error creating event",
                error: error.message,
            }, 500); // HTTP status code 500 indicates internal server error
        }
    },
    async addNewMatch(ctx) {
        try {
            const { game, date, team1, team2, event, venue } = ctx.request.body;
            // 1. Validate: Teams must not be the same
            if (team1 === team2) {
                return ctx.send({
                    message: "Team 1 and Team 2 cannot be the same",
                }, 400);
            }
            console.log("payload", ctx.request.body);
            // 2. Fetch event dates
            const eventDetails = await strapi.entityService.findOne("api::event.event", event, {
                fields: ["startDate", "endDate"],
            });
            if (!eventDetails) {
                return ctx.send({
                    message: "Event not found",
                }, 404);
            }
            // Normalize times to 00:00 for comparison
            const matchDate = new Date(date).setHours(0, 0, 0, 0);
            const eventStartDate = new Date(eventDetails.startDate).setHours(0, 0, 0, 0);
            const eventEndDate = new Date(eventDetails.endDate).setHours(0, 0, 0, 0);
            const today = new Date().setHours(0, 0, 0, 0);
            // 3. Validate: Match date must not be in the past
            if (matchDate < today) {
                return ctx.send({
                    message: "Match date cannot be in the past",
                }, 400);
            }
            // 4. Validate: Match date must be within event range
            if (matchDate < eventStartDate || matchDate > eventEndDate) {
                return ctx.send({
                    message: "Match date must be between the event start and end dates",
                }, 400);
            }
            // 5. Check for existing match at same venue, same date/time
            const existingMatches = await strapi.entityService.findMany("api::match.match", {
                filters: {
                    venue: { $eq: venue },
                    matchtime: { $eq: date },
                },
            });
            if (existingMatches.length > 0) {
                return ctx.send({
                    message: "A match is already scheduled at this venue at the same date and time",
                }, 400);
            }
            // 6. Create the new match
            const newMatch = await strapi.entityService.create("api::match.match", {
                data: {
                    game: game,
                    matchtime: date,
                    event: event,
                    team_1: team1,
                    team_2: team2,
                    venue: venue,
                },
            });
            return ctx.send({
                message: "Match created successfully",
                data: newMatch,
            });
        }
        catch (error) {
            console.error("Error creating match:", error);
            return ctx.send({
                message: "Error creating match",
                error: error.message,
            }, 500);
        }
    },
    async addMatchScore(ctx) {
        try {
            const { team1Score, team2Score, winnerId, matchId } = ctx.request.body;
            console.log("Received payload:", ctx.request.body);
            // Find the match by ID
            const existingMatch = await strapi.entityService.findOne("api::match.match", matchId);
            console.log("match id");
            if (!existingMatch) {
                return ctx.send({
                    message: "Match not found",
                }, 404);
            }
            const winner = await strapi
                .query("api::team.team")
                .findOne({ where: { id: winnerId } });
            if (!winner) {
                return ctx.send({
                    message: "Winner team not found",
                }, 400);
            }
            // Update the match
            const updatedMatch = await strapi.entityService.update("api::match.match", matchId, {
                data: {
                    team1_Score: team1Score,
                    team2_Score: team2Score,
                    winner: { id: winner.id },
                },
            });
            return ctx.send({
                message: "Match score updated successfully",
                data: updatedMatch,
            });
        }
        catch (error) {
            console.error("Error updating match score:", error);
            return ctx.send({
                message: "Error updating match score",
                error: error.message,
            }, 500);
        }
    },
}));
