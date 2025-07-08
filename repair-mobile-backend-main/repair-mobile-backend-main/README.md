<<<<<<< HEAD
=======
# Shop Manager Backend API

A comprehensive Node.js/Express backend for shop management system with authentication, payments, inventory, and more.

## Features

- 🔐 JWT Authentication
- 💰 Payment Management
- 📦 Product & Inventory Management
- 👥 Customer Management
- 🛠️ Maintenance Tracking
- 👨‍💼 Cashier Management
- 📊 Attendance Tracking
- 💼 Salary Management
- 📱 Device Issues & Types
- 🏪 Supplier Management

## Tech Stack

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **nodemailer** for email functionality
- **CORS** enabled

## Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd repair-mobile-backend-sahan-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   PORT=5002
   ```

4. **Run the server**
   ```bash
   npm start
   # or for development with nodemon
   npm run dev
   ```

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Set Environment Variables**
   In Render dashboard, add these environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `EMAIL_USER` - Your email address
   - `EMAIL_PASS` - Your email app password

4. **Deploy**
   - Render will automatically build and deploy your app
   - Your API will be available at: `https://your-app-name.onrender.com`

### Option 2: Manual Setup

1. **Create a new Web Service**
   - Go to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure the service**
   - **Name**: shopmanager-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

3. **Add Environment Variables**
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `GET /api/payments/:id` - Get payment by ID

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer
- `PUT /api/customers/:id` - Update customer

### And many more endpoints for all features...

## Environment Variables Required

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password
- `PORT` - Server port (Render sets this automatically)

## Health Check

The API includes a health check endpoint at `/` that returns a simple message to verify the service is running.

## Support

For issues or questions, please check the logs in Render dashboard or contact the development team.

>>>>>>> feature-yashini
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)
<<<<<<< HEAD
https://defective-elbow-production.up.railway.app
=======
>>>>>>> feature-yashini

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
"# mobile-repair" 
