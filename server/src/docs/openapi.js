import swaggerJsdoc from 'swagger-jsdoc'

const API_BASE = process.env.API_PUBLIC_URL || 'http://localhost:4000'

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'TrustedHome API',
    version: '1.0.0',
    description: 'API documentation for TrustedHome platform.',
  },
  servers: [{ url: API_BASE }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Admin' },
    { name: 'Listings' },
    { name: 'Payments' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Invalid body' },
        },
        required: ['ok', 'error'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'usr_abc123' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          displayName: { type: 'string', example: 'Jane Doe' },
          role: { type: 'string', enum: ['USER', 'AGENT'], example: 'USER' },
          avatarUrl: { type: 'string', nullable: true, example: null },
          phone: { type: 'string', nullable: true, example: '+2348012345678' },
          emailVerified: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Staff: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'staff_01' },
          email: { type: 'string', format: 'email', example: 'admin@trustedhome.render' },
          name: { type: 'string', example: 'TrustedHome Admin' },
          roleLabel: { type: 'string', example: 'super-admin' },
          status: { type: 'string', example: 'ACTIVE' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Listing: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'lst_123' },
          userId: { type: 'string', example: 'usr_abc123' },
          title: { type: 'string', example: '3 Bedroom Apartment' },
          description: { type: 'string', nullable: true, example: 'Spacious apartment in Lekki.' },
          location: { type: 'string', example: 'Lekki, Lagos' },
          priceNgn: { type: 'integer', example: 125000000 },
          purpose: { type: 'string', nullable: true, example: 'SALE' },
          propertyType: { type: 'string', nullable: true, example: 'APARTMENT' },
          bedrooms: { type: 'integer', nullable: true, example: 3 },
          bathrooms: { type: 'integer', nullable: true, example: 3 },
          areaSqm: { type: 'integer', nullable: true, example: 145 },
          status: { type: 'string', example: 'PENDING' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 10, example: 'StrongPass!123' },
          displayName: { type: 'string', example: 'Jane Doe' },
          role: { type: 'string', enum: ['USER', 'AGENT'] },
          phone: { type: 'string', example: '+2348012345678' },
          agencyName: { type: 'string', example: 'Prime Properties' },
          licenseId: { type: 'string', example: 'LIC-2330' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password', 'intent'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          intent: { type: 'string', enum: ['USER', 'AGENT'] },
        },
      },
      VerifyEmailRequest: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
        },
      },
      ResendVerifyRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      GoogleLoginRequest: {
        type: 'object',
        required: ['idToken', 'intent'],
        properties: {
          idToken: { type: 'string' },
          intent: { type: 'string', enum: ['USER', 'AGENT'] },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      ForgotPasswordResetRequest: {
        type: 'object',
        required: ['email', 'otp', 'newPassword'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
          newPassword: { type: 'string', minLength: 10, example: 'NewStrongPass!123' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'otp'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 10 },
          otp: { type: 'string', pattern: '^\\d{6}$', example: '123456' },
        },
      },
      AdminLoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      CreateStaffRequest: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 10 },
          name: { type: 'string', minLength: 2 },
          roleLabel: { type: 'string', example: 'operations' },
        },
      },
      ListingCreateRequest: {
        type: 'object',
        required: ['title', 'location', 'priceNgn'],
        properties: {
          title: { type: 'string', minLength: 2 },
          description: { type: 'string' },
          location: { type: 'string', minLength: 2 },
          priceNgn: { type: 'integer', minimum: 1 },
          purpose: { type: 'string' },
          propertyType: { type: 'string' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'integer' },
          areaSqm: { type: 'integer' },
        },
      },
      ListingPatchRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 2 },
          description: { type: 'string' },
          location: { type: 'string', minLength: 2 },
          priceNgn: { type: 'integer', minimum: 1 },
          purpose: { type: 'string' },
          propertyType: { type: 'string' },
          bedrooms: { type: 'integer' },
          bathrooms: { type: 'integer' },
          areaSqm: { type: 'integer' },
        },
      },
      PaymentInitializeRequest: {
        type: 'object',
        required: ['email', 'amountNgn'],
        properties: {
          email: { type: 'string', format: 'email' },
          amountNgn: { type: 'number', example: 25000 },
          callbackUrl: { type: 'string', format: 'uri' },
          metadata: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'API is healthy',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, service: { type: 'string' } } } } },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with OTP',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyEmailRequest' } } } },
        responses: {
          200: { description: 'Email verified', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/otp/resend-verify': {
      post: {
        tags: ['Auth'],
        summary: 'Resend verification OTP',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResendVerifyRequest' } } } },
        responses: {
          200: {
            description: 'OTP sent',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
    '/api/auth/google': {
      post: {
        tags: ['Auth'],
        summary: 'Google login',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GoogleLoginRequest' } } } },
        responses: {
          200: { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request forgot-password OTP',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordRequest' } } } },
        responses: {
          200: {
            description: 'OTP request accepted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
    '/api/auth/forgot-password/reset': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with OTP',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordResetRequest' } } },
        },
        responses: {
          200: { description: 'Password reset', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/otp/password-change': {
      post: {
        tags: ['Auth'],
        summary: 'Request password-change OTP (logged in)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'OTP sent', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/password': {
      put: {
        tags: ['Auth'],
        summary: 'Change password with OTP (logged in)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } } },
        responses: {
          200: { description: 'Password changed', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, user: { $ref: '#/components/schemas/User' } } } },
            },
          },
        },
      },
    },
    '/api/admin/auth/login': {
      post: {
        tags: ['Admin'],
        summary: 'Admin/staff login',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminLoginRequest' } } } },
        responses: {
          200: {
            description: 'Logged in',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    token: { type: 'string' },
                    staff: { $ref: '#/components/schemas/Staff' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/auth/me': {
      get: {
        tags: ['Admin'],
        summary: 'Current staff session',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current staff',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    staff: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        source: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/staff': {
      get: {
        tags: ['Admin'],
        summary: 'List staff users',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Staff list',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, staff: { type: 'array', items: { $ref: '#/components/schemas/Staff' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create staff user',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateStaffRequest' } } } },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, staff: { $ref: '#/components/schemas/Staff' } } },
              },
            },
          },
        },
      },
    },
    '/api/listings': {
      get: {
        tags: ['Listings'],
        summary: 'List listings',
        parameters: [
          { name: 'take', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'skip', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Listings',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, listings: { type: 'array', items: { $ref: '#/components/schemas/Listing' } } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Listings'],
        summary: 'Create listing',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ListingCreateRequest' } } } },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, listing: { $ref: '#/components/schemas/Listing' } } },
              },
            },
          },
        },
      },
    },
    '/api/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Get listing by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Listing',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, listing: { $ref: '#/components/schemas/Listing' } } },
              },
            },
          },
        },
      },
      put: {
        tags: ['Listings'],
        summary: 'Update listing',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ListingPatchRequest' } } } },
        responses: {
          200: {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, listing: { $ref: '#/components/schemas/Listing' } } },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Listings'],
        summary: 'Delete listing',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { ok: { type: 'boolean' }, deleted: { type: 'boolean', example: true } } },
              },
            },
          },
        },
      },
    },
    '/api/payments/initialize': {
      post: {
        tags: ['Payments'],
        summary: 'Initialize payment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentInitializeRequest' } } },
        },
        responses: {
          200: {
            description: 'Initialized or stub response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    mode: { type: 'string', nullable: true, example: 'stub' },
                    reference: { type: 'string', example: 'th_5ff9d0...' },
                    authorization_url: { type: 'string', nullable: true },
                    message: { type: 'string', nullable: true },
                    metadata: { type: 'object', additionalProperties: true },
                    error: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Paystack webhook',
        responses: {
          200: { description: 'Webhook accepted' },
          400: { description: 'Bad signature' },
        },
      },
    },
  },
}

export const openapiSpec = swaggerJsdoc({ definition, apis: [] })
