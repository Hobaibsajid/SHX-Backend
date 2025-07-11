/**
 * coach controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::coach.coach', ({ strapi }) => ({
    async registerCoach(ctx) {
      try {
        // Destructure the fields directly from the request body
        const { firstName, lastName, email, password,confirmPassword,role , sport } = ctx.request.body;
     console.log('l', ctx.request.body);
     
        // Validation (optional)
        if (!firstName || !lastName || !email || !password ) {
          return ctx.badRequest('Missing required fields.');
        }
  
        //Check if the passwords match
        if (password !== confirmPassword) {
          return ctx.badRequest('Passwords do not match.');
        }
  
        // Check if the organizer already exists by email
        const existingCoach = await strapi.query('plugin::users-permissions.user').findOne({
          where: { email:email },
        });
  
        if (existingCoach) {
          return ctx.badRequest('Coach with this email already exists.');
        }
  
        // Create the new organizer
       
        const fullName = `${firstName} ${lastName}`;
        let newCoach:any;
        const newUser = await strapi.entityService.create(
          'plugin::users-permissions.user',
          {
            data: {
              email: email,
              password: password, // Ensure the password is hashed automatically by Strapi
              username: fullName,
              confirmed:false,
              blocked:true,
              type:'coach',
            },
          }
        );
        newCoach = await strapi.entityService.create('api::coach.coach', {
          data: {
          fullName: fullName,
          email: email,
          coachStatus:'pending',
          sport:sport,
          userId: newUser.id,
        },
      });
      await strapi.entityService.update(
        'plugin::users-permissions.user',
        newUser.id, 
        {
          data: {
            coachId: newCoach.id, // Add the organizer ID to the user
          },
        }
      );
    
      
     
        // Return the new organizer (without password)
        ctx.send({
          message: 'Coach registered successfully!',
          organizer: {
            firstName: newCoach.firstName,
            lastName: newCoach.lastName,
            email: newCoach.email,
          },
          user: {
            username: newUser.username,
            email: newUser.email,
           
          },
        });
      } catch (error) {
        console.error('Error during registration:', error);
        ctx.internalServerError('Something went wrong while registering the organizer.');
      }
    },

    async loginUser(ctx) {
        const { email, password } = ctx.request.body;
        console.log('payload',ctx.request.body);
        
        console.log('Request Body:', ctx.request.body); // Log the request to inspect the data
        
        // Step 1: Fetch user by username or email
        let user;
        try {
          user = await strapi.query('plugin::users-permissions.user').findOne({
            where: {
              $or: [
                { email }, // Check by username
                { email: email } // Or check by email
              ],
            },
          });
        } catch (err) {
         // console.error("Error fetching user:", err);
          return ctx.badRequest("Error fetching user.");
        }
        
        if (!user) {
          
          return ctx.badRequest('Invalid credentials');
        }
       
        if (!user.confirmed  || user.blocked) {
          
          return ctx.internalServerError('Account not approved yet');
        }
        try {
          const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(password, user.password);
          
          if (!validPassword) {
            // Password doesn't match
            return ctx.badRequest('Invalid credentials');
          }
      
          const completeUser = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            user.id, // User ID
            {
              populate: '*', // Populate all fields and relations (use specific fields for better performance)
            }
          );
          return ctx.send({
            message: 'Login successful',
            user: completeUser,
          });
        } catch (err) {
          console.error("Error during password validation:", err);
          return ctx.internalServerError("Error during password validation.");
        }
      },

      async acceptPlayerRequest(ctx) {
        const { playerId, teamId } = ctx.request.body;
        console.log('payload',ctx.request.body);
        try {
          // First, update the team: connect playerId to players and disconnect from playerRequests
          const updatedTeam = await strapi.db.query('api::team.team').update({
            where: { id: teamId },
            data: {
              players: {
                connect: [{ id: playerId }], // Connect player to players field
              },
              playerRequests: {
                disconnect: [{ id: playerId }], // Disconnect player from playerRequests field
              },
            },
          });
      
          return ctx.send({
            message: 'Player added to team and removed from requests',
            team: updatedTeam,
          });
        } catch (err) {
          console.error(err);
          return ctx.internalServerError('Something went wrong while accepting the request.');
        }


      },
      async rejectPlayerRequest(ctx) {
        const { playerId, teamId } = ctx.request.body;
        console.log('payload',ctx.request.body);
        try {
          // First, update the team: connect playerId to players and disconnect from playerRequests
          const updatedTeam = await strapi.db.query('api::team.team').update({
            where: { id: teamId },
            data: {
              rejectedPlayerRequests: {
                connect: [{ id: playerId }], // Connect player to players field
              },
              playerRequests: {
                disconnect: [{ id: playerId }], // Disconnect player from playerRequests field
              },
            },
          });
      
          return ctx.send({
            message: 'Player added to team and removed from requests',
            team: updatedTeam,
          });
        } catch (err) {
          console.error(err);
          return ctx.internalServerError('Something went wrong while accepting the request.');
        }


      },
      async createNewplayer(ctx) {
        try {
          const { teamName, players, coachId ,sport} = ctx.request.body;
      
          console.log('Payload:', ctx.request.body);
      
          if (!teamName || !players || !coachId || !sport) {
            return ctx.badRequest('Missing required fields.');
          }
      
          // Step 1: Check if a team with the same name already exists
          const existingTeam = await strapi.entityService.findMany('api::team.team', {
            filters: { teamName: teamName },
          });
      
          if (existingTeam.length > 0) {
            return ctx.badRequest('A team with this name already exists.');
          }
      
          // Step 2: Create new team
          const newTeam = await strapi.entityService.create('api::team.team', {
            data: {
              teamName: teamName,
              players,
              coachid: coachId,
              sport: sport 
            },
          });
      
          ctx.send({
            message: 'Team created successfully!',
            team: newTeam,
          });
        } catch (error) {
          console.error('Error creating team:', error);
          ctx.internalServerError('Something went wrong while creating the team.');
        }
      },

     async removePlayer(ctx) {
  try {
    const { teamId, playerId } = ctx.request.body;

    if (!teamId || !playerId) {
      return ctx.badRequest('Missing teamId or playerId');
    }

    console.log('Payload:', ctx.request.body);

    // Update player and disconnect the team
      const updatedPlayer = await strapi.db.query('api::player.player').update({
      where: { id: playerId },
      data: {
        teams: {
          disconnect: [{ id: teamId }],
        },
      },
    });
    ctx.send({
      message: 'Player removed from team successfully!',
      player: updatedPlayer,
    });
  } catch (error) {
    console.error('Error removing player:', error);
    ctx.internalServerError('Something went wrong while removing player.');
  }
},
  async assignRole(ctx) {
  try {
    const { role, playerId,number } = ctx.request.body;

    if (!role || !playerId) {
      return ctx.badRequest('Missing role or playerId');
    }

    const updatedPlayer = await strapi.entityService.update('api::player.player', playerId, {
      data: {
       role: role,
       playerNumber:number
      },
    });

    ctx.send({
      message: 'Player role assigned successfully!',
      player: updatedPlayer,
    });

  } catch (error) {
    console.error('Error assigning role to player:', error);
    ctx.internalServerError('Something went wrong while assigning role.');
  }
}



      


}));