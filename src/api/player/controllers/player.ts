/**
 * player controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::player.player', ({ strapi }) => ({
    async registerPlayer(ctx) {
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
        const existingPlayer = await strapi.query('plugin::users-permissions.user').findOne({
          where: { email:email },
        });
  
        if (existingPlayer) {
          return ctx.badRequest('player with this email already exists.');
        }
  
        // Create the new organizer
       
        const fullName = `${firstName} ${lastName}`;
        let newPlayer:any;
        const newUser = await strapi.entityService.create(
          'plugin::users-permissions.user',
          {
            data: {
              email: email,
              password: password, // Ensure the password is hashed automatically by Strapi
              username: fullName,
              confirmed:true,
              blocked:false,
              type:'player',
            },
          }
        );
        newPlayer = await strapi.entityService.create('api::player.player', {
          data: {
          name: fullName,
          sport:sport,
          userId: newUser.id,
        },
      });
      await strapi.entityService.update(
        'plugin::users-permissions.user',
        newUser.id, 
        {
          data: {
            playerId: newPlayer.id, 
          },
        }
      );
    
      
     
        
        ctx.send({
          message: 'Coach registered successfully!',
          organizer: {
            firstName: newPlayer.firstName,
            lastName: newPlayer.lastName,
            email: newPlayer.email,
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
    async requestJoinTeam(ctx) {
      const { team,player } = ctx.request.body;
      console.log('l', ctx.request.body);
      try {
      const requestPlayer = await strapi.db.query("api::team.team").update({ 
        where: { id: team }, 
        data: {
          playerRequests: { 
            connect: [{ id: player }],  
          },
        },
      });
     
      ctx.send({
        message: 'player request recieved!',
        requestPlayer
      });
    } catch (error) {
      console.error('Error during sending request:', error);
      ctx.internalServerError('Something went wrong while sending request.');
    }
    },
}));
