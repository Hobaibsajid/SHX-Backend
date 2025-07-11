export default {
    routes: [
      {
        method: 'POST',
        path: '/organizers/register-organizer', 
        handler: 'organizer.registerOrganizer',
        config: {
          auth: false, 
        },
      },
      {
        method: 'POST',
        path: '/organizers/login-user', 
        handler: 'organizer.loginUser',
        config: {
          auth: false, 
        },
      },
      {
        method: 'POST',
        path: '/organizers/updateCoachStatus',
        handler: 'organizer.updateCoachStatus',
        config: {
          auth: false, 
        },
      },
      {
        method: 'POST',
        path: '/organizers/addNewEvent',
        handler: 'organizer.addNewEvent',
        config: {
          auth: false, 
        },
      },
      {
        method: 'POST',
        path: '/organizers/addNewMatch',
        handler: 'organizer.addNewMatch',
        config: {
          auth: false, 
        },
      },
      {
        method: 'POST',
        path: '/organizers/addMatchScore',
        handler: 'organizer.addMatchScore',
        config: {
          auth: false, 
        },
      },
      
    ],
  };