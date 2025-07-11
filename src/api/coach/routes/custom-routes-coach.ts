export default {
    routes: [
      {
        method: 'POST',
        path: '/coaches/register-coach', // Custom endpoint for registration
        handler: 'coach.registerCoach',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/organizers/login-user', // Custom endpoint for registration
        handler: 'coach.loginUser',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/coaches/accept-request', // Custom endpoint for registration
        handler: 'coach.acceptPlayerRequest',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/coaches/reject-request', // Custom endpoint for registration
        handler: 'coach.rejectPlayerRequest',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/coaches/create-new-team', // Custom endpoint for registration
        handler: 'coach.createNewplayer',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/coaches/remove-player', // Custom endpoint for registration
        handler: 'coach.removePlayer',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
      {
        method: 'POST',
        path: '/coaches/assign-role', // Custom endpoint for registration
        handler: 'coach.assignRole',
        config: {
          auth: false, // Disable authentication for this specific endpoint (if needed)
        },
      },
    ],
  };