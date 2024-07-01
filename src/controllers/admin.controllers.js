import { Admin } from "../../models/admin.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/apiError.js";
import Blog from "../../models/blog.model.js";
import HealthSurvey from "../../models/HealthSurvey.model.js";
import { deleteFile } from "../../helpers/s3Bucket.js";
import { generateOTP } from "../../helpers/otpGenerator.js";
import mailSender from "../../utils/mailSender.js";
import { validateEmail } from "../../validators/emailValidater.js";
import { validateOtp } from "../../validators/otpValidator.js";
import jwt from 'jsonwebtoken';
import sendNotification from "../../utils/sendNotification.js";
import moment from "moment-timezone";

export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    let admin = await Admin.findOne({ email });

    if (!admin) {
        if (email === process.env.SUPER_ADMIN_USER) {
            const superAdminEmail = process.env.SUPER_ADMIN_USER;
            const superAdminPassword = process.env.SUPER_ADMIN_PASS;

            admin = await Admin.create({
                firstName: "Tech",
                lastName: "Admin",
                email: superAdminEmail,
                password: superAdminPassword,
                isVerified: true,
                role: "super-admin",
                systemGeneratedPass: false
            });
        } else {
            throw new ApiError(404, "Admin does not exist");
        }
    }

    const isPasswordValid = await admin.isPasswordMatch(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid admin credentials");
    }

    const accessToken = await admin.generateAccessToken();
    const options = {
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    };

    const { password: adminPassword, ...adminData } = admin._doc;

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse({ admin: adminData, accessToken }, "Logged-in successfully"));
});

export const currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(req.user, "Current user fetched successfully"));
});
export const registerAdmin = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, image } = req.body;

    const requiredFields = ['firstName', 'lastName', 'email', 'password', "phone"];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === "") {
            throw new ApiError(400, `${field} is required`);
        }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, 'Invalid email format');
    }

    if (password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters long');
    }
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        throw new ApiError(409, "User already exists");
    }

    const admin = await Admin.create({
        firstName,
        lastName,
        email,
        password,
        phone,
        image
    });
    const mailTemp = { email: admin.email, heading: "Password", name: admin?.fullName, text: password, type: "password" }
    try {
        mailSender(mailTemp, "password")
    } catch (error) {
        console.log(error)
    }

    return res.status(200).json(new ApiResponse(admin, "Admin registered successfully"));

});

export const AllUsers = asyncHandler(async (req, res) => {
    const { count = 10, skip = 0, role, access, search, orderBy = 'createdAt', order = 'DESC' } = req.query;
    const query = {};
    let totalCount = 0;
    let users = [];

    if (access) {
        query.access = access;
    }

    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
            { fullName: regex },
            { healthID: regex },
            { gender: regex },
            { access: regex },
            { email: regex },
        ];
    }

    let sortOption = {};
    sortOption[orderBy] = order === 'ASC' ? 1 : -1;
    console.log(sortOption);

    if (role === "clinical") {
        totalCount = await Clinical.countDocuments(query);
        users = await Clinical.find(query)
            .collation({ locale: "en" })
            .sort(sortOption)
            .skip(parseInt(skip))
            .limit(parseInt(count))
            .select("-password");
    } else {
        totalCount = await Patient.countDocuments(query);
        users = await Patient.find(query)
            .collation({ locale: "en" })
            .sort(sortOption)
            .skip(parseInt(skip))
            .limit(parseInt(count))
            .select("-password");
    }

    console.log(query);

    return res.status(200).json(new ApiResponse({ resp: users, totalCount }, "Users retrieved successfully"));
});



export const AddBlog = asyncHandler(async (req, res) => {
    const newBlog = await Blog.create(req.body)
    return res.status(200).json(new ApiResponse(newBlog, "Blogs created succesfully"));

})

export const AllBlogs = asyncHandler(async (req, res) => {
    const { count = 10, skip = 0, orderBy = 'createdAt', order = 'DESC', search = '', published } = req.query;

    if (count < 0 || skip < 0) {
        throw new ApiError(400, "Count and skip parameters must be provided as non-negative integers");
    }

    const countInt = parseInt(count, 10);
    const skipInt = parseInt(skip, 10);

    let sortOption = {};
    sortOption[orderBy] = order === 'ASC' ? 1 : -1;
    let matchOption = {};
    if (search) {
        matchOption = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { "category.title": { $regex: search, $options: 'i' } }
            ]
        };
    }
    console.log(sortOption)

    if (published) {
        matchOption.published = published === 'true';

    }


    const blogs = await Blog.aggregate([
        {
            $match: matchOption
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category'
            }
        },
        {
            $unwind: '$category'
        },
        {
            $sort: sortOption
        },
        {
            $skip: skipInt
        },
        {
            $limit: countInt
        },


    ]).collation({ locale: "en" });

    const totalCount = await Blog.countDocuments(matchOption);

    return res.status(200).json(new ApiResponse({
        resp: blogs,
        totalCount,
    }, "Blogs fetched successfully"));
});



export const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, category, image, published } = req.body;

    const updatedBlog = await Blog.findByIdAndUpdate(id, { name, description, category, published }, { new: true });
    if (!updatedBlog) {
        throw new ApiError(404, "Blog not found");
    }


    if (image && updatedBlog.image && image !== updatedBlog.image) {

        await deleteFile(updatedBlog.image);

    }
    updatedBlog.image = image;
    await updatedBlog.save();

    res.status(200).json(new ApiResponse(updatedBlog, "Blog updated successfully"));
});

export const appointmentWithStatus = asyncHandler(async (req, res) => {
    const { count = 10, skip = 0, status, orderBy = 'createdAt', order = 'DESC', search } = req.query;

    // Validate count and skip parameters
    if (count < 0 || skip < 0) {
        throw new ApiError(400, "Count and skip parameters must be provided as non-negative integers");
    }

    // Construct sorting option
    const sortOption = {};
    sortOption[orderBy] = order === 'ASC' ? 1 : -1;

    // Construct search query
    const searchQuery = {};
    if (search) {
        const searchRegex = { $regex: search, $options: "i" }
        searchQuery.$or = [
            { 'comment': searchRegex },
            { 'patient.fullName': searchRegex },
            { 'clinical.fullName': searchRegex },
            { 'status': searchRegex },

        ];
    }



    if (status) {
        searchQuery.status = status;
    }
    const pipeline = [];
    pipeline.push({
        $lookup: {
            from: "clinicals",
            localField: "clinical",
            foreignField: "_id",
            as: "clinical"
        }
    });
    pipeline.push({
        $lookup: {
            from: "patients",
            localField: "patient",
            foreignField: "_id",
            as: "patient"
        }
    });
    pipeline.push({ $sort: sortOption });
    pipeline.push({ $match: searchQuery });

    pipeline.push({ $skip: parseInt(skip) });
    pipeline.push({ $limit: parseInt(count) });

    pipeline.push({ $unwind: "$patient" });
    pipeline.push({ $unwind: "$clinical" });

    const appointments = await Appointment.aggregate(pipeline).collation({ locale: "en" });
    const totalCount = await Appointment.countDocuments(searchQuery);
    return res.status(200).json(new ApiResponse({
        resp: appointments,
        totalCount
    }, "Appointments fetched successfully"));
});

export const verifyHealthId = asyncHandler(
    async (req, res) => {
        const { healthID, access } = req.body;
        if (!healthID || !access) {
            throw new ApiError(400, "HealthId and access are required");
        }
        if (typeof healthID !== 'string' || typeof access !== 'string') {
            throw new ApiError(400, "HealthId and type must be strings");
        }
        const user = await Patient.findOne({ healthID });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        user.access = access;
        await user.save();

        let message = "Your health ID is ";

        if (access === "full") {
            message += "successfully verified by our team.";
        } else if (access === "blocked") {
            message += "blocked by our team and you do not have any kind of access for time being.";
        } else {
            message += "unverified by our team and your access is restricted for the time being.";
        }

        const mailTemp = { email: user?.email, heading: "Health ID", message, name: user?.fullName, type: "verify id" }
        try {
            await mailSender(mailTemp)
        } catch (error) {
            console.log(error)
        }

        res.status(200).json(new ApiResponse(null, `Permission changed`));

    }

)
export const AddUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    const requiredFields = { firstName, lastName, email, password };
    for (const [field, value] of Object.entries(requiredFields)) {
        if (!value || value.trim() === "") {
            throw new ApiError(400, `${field} is required`);
        }
    }

    if (role !== "clinical" && role !== "patient") {
        throw new ApiError(400, "Invalid role provided");
    }

    // Validate the email format
    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email provided");
    }

    // Check if the email exists in either the Clinical or Patient collections
    const existingUserInClinical = await Clinical.findOne({ email });
    const existingUserInPatient = await Patient.findOne({ email });
    console.log(existingUserInClinical, existingUserInPatient);
    if (existingUserInClinical || existingUserInPatient) {
        throw new ApiError(409, "User already exists");
    }

    // Select the correct model based on the role
    let User;
    if (role === "clinical") {
        User = Clinical;
    } else {
        User = Patient;
    }
    req.body.systemGeneratedPass = true
    const user = await User.create(req.body);
    console.log(user)
    const { password: _, ...rest } = user._doc;
    const mailTemp = { email, name: rest?.fullName, text: password, type: "password", heading: "Password" }
    try {
        await mailSender(mailTemp, "password");
    } catch (error) {
        console.log(error)
    }

    return res.status(201).json(new ApiResponse({ ...rest }, "User registered successfully"));
});

export const UpdateUser = asyncHandler(async (req, res) => {
    const { role, id } = req.params;
    const { image, firstName, lastName, age, phone, timezone, shiftStart, shiftEnd, bio, gender, access } = req.body;

    const updateData = { firstName, lastName, age, phone, shiftStart, shiftEnd, bio, gender, access, image, timezone };

    let User;

    if (role === "clinical") {
        User = Clinical;
    } else if (role === "patient") {
        User = Patient;
    } else {
        User = Admin;
    }

    const existingUser = await User.findById(id);

    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }
    if (image && existingUser.image && image !== existingUser.image) {
        await deleteFile(existingUser.image);
    }
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            existingUser[key] = updateData[key];
        }
    })

    await existingUser.save();

    const { password, ...rest } = existingUser.toObject();

    return res.status(200).json(new ApiResponse({ ...rest }, "User updated successfully"));
});

export const counts = asyncHandler(async (req, res) => {
    const { year } = req.params;

    const getCountsPerMonth = async (model, filter = {}, dateField = "createdAt") => {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year + 1, 0, 1);

        const result = await model.aggregate([
            {
                $match: {
                    ...filter,
                    [dateField]: {
                        $gte: startOfYear,
                        $lt: endOfYear,
                    },
                },
            },
            {
                $group: {
                    _id: { month: { $month: `$${dateField}` } },
                    count: { $sum: 1 },
                },
            },
        ]);

        let counts = Array(12).fill(0);
        result.forEach(({ _id, count }) => {
            counts[_id.month - 1] = count;
        });

        const totalCount = counts.reduce((acc, curr) => acc + curr, 0);
        return { counts, totalCount };
    };


    const { counts: patientCounts, totalCount: totalPatientCount } = await getCountsPerMonth(Patient);
    const { counts: clinicalCounts, totalCount: totalClinicalCount } = await getCountsPerMonth(Clinical);
    const { counts: appointmentCounts, totalCount: totalAppointmentCount } = await getCountsPerMonth(Appointment, {}, "start");
    const { counts: surveyCounts, totalCount: totalSurveyCount } = await getCountsPerMonth(HealthSurvey);
    const { counts: blogCounts, totalCount: totalBlogCount } = await getCountsPerMonth(Blog);
    res.status(200).json(new ApiResponse({
        patientCounts,
        totalPatientCount,
        clinicalCounts,
        totalClinicalCount,
        appointmentCounts,
        totalAppointmentCount,
        blogCounts,
        totalBlogCount,
        surveyCounts,
        totalSurveyCount,
    }, "Counts fetched successfully"));

})

export const deleteEntry = asyncHandler(async (req, res) => {
    const { id, type } = req.params;

    if (!id || !type) {
        throw new ApiError(400, 'Invalid input. Both ID and type must be provided.');
    }

    let Model;
    switch (type) {
        case 'patient':
            Model = Patient;
            break;
        case 'clinical':
            Model = Clinical;
            break;
        case 'appointment':
            Model = Appointment;
            break;
        case 'blog':
            Model = Blog;
            break;
        case 'survey':
            Model = HealthSurvey;
            break;
        case 'question':
            Model = Question;
            break;
        case 'categories':
            Model = Category;
            break;
        default:
            throw new ApiError(400, 'Invalid type. Supported types are: patient, clinical, appointment, blog, survey.');
    }

    const item = await Model.findByIdAndDelete(id);
    if (!item) {
        throw new ApiError(404, `${type} not found`);
    }

    res.status(200).json(new ApiResponse(null, `${type} deleted successfully`));
});


export const fetchSurvey = asyncHandler(async (req, res) => {
    const { type = 'metric', search = '', skip = 0, count = 10, orderBy = 'createdAt', order = "DESC", status } = req.query;
    let Model;
    if (type === 'mood') {
        Model = MoodSurvey;
    } else {
        Model = HealthSurvey;
    }

    const searchFilter = search ? { description: { $regex: search, $options: 'i' } } : {};
    const statusFilter = status ? { status: status } : {};
    let sortOption = {};
    let aggregationPipeline = [];

    aggregationPipeline.push({ $lookup: { from: 'patients', localField: 'patient', foreignField: '_id', as: 'patient' } });
    aggregationPipeline.push({ $unwind: '$patient' });

    const matchFilter = { ...searchFilter, ...statusFilter };
    aggregationPipeline.push({ $match: matchFilter });

    sortOption = orderBy ? { [orderBy]: order === 'ASC' ? 1 : -1 } : {};
    aggregationPipeline.push({ $sort: sortOption });
    aggregationPipeline.push({ $skip: parseInt(skip, 10) });
    aggregationPipeline.push({ $limit: parseInt(count, 10) });

    const surveys = await Model.aggregate(aggregationPipeline).collation({ locale: "en" });

    const totalCount = await Model.countDocuments(matchFilter);
    return res.status(200).json(new ApiResponse({
        resp: surveys,
        totalCount,
    }, 'Surveys fetched successfully'));
});


export const AllAdmin = asyncHandler(async (req, res) => {
    const { count = 10, skip = 0, search, order = 'DESC', orderBy = 'createdAt', gender, access } = req.query;
    const query = { role: "admin" };
    let totalCount = 0;
    let users = [];

    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
            { fullName: regex },
            { gender: regex },
            { access: regex },
            { email: regex },
        ];
    }

    if (gender) {
        query.gender = gender;
    }

    if (access) {
        query.access = access;
    }

    totalCount = await Admin.countDocuments(query);

    const sortOrder = order === 'ASC' ? 1 : -1;

    users = await Admin.find(query).collation({ locale: "en" })
        .sort({ [orderBy]: sortOrder })
        .skip(parseInt(skip))
        .limit(parseInt(count));

    return res.status(200).json(new ApiResponse({ resp: users, totalCount }, "Users retrieved successfully"));
});


export const AddQuestion = asyncHandler(async (req, res) => {
    const { question, options, primary } = req.body;

    if (!question) {
        throw new ApiError(400, "Question is required");
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
        throw new ApiError(400, "Options are empty");
    }

    for (let i = 0; i < options.length; i++) {
        if (!options[i].text) {
            throw new ApiError(400, "Option text cannot be empty");
        }
    }

    if (primary) {
        let primaryQuestion = await Question.findOne({ primary: 1 });
        if (primaryQuestion) {
            primaryQuestion.primary = 0;
            await primaryQuestion.save();
        } else {
            console.log("No primary question found.");
        }
    }

    // Create the new question
    const newQuestion = await Question.create({
        question,
        options,
        primary
    });

    return res.status(200).json(new ApiResponse(newQuestion, "Question Added successfully"));
});


export const GetQuestion = asyncHandler(async (req, res) => {
    const { count = 10, skip = 0, search } = req.query;
    const query = {};
    let totalCount = 0;
    let questions = [];



    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
            { question: regex },
        ];
    }


    totalCount = await Question.countDocuments(query);
    questions = await Question.find(query)
        // .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(count));

    if (!questions || questions.length === 0) {
        throw new ApiError(404, "No questions found");
    }

    return res.status(200).json(new ApiResponse({ resp: questions, totalCount }, "Questions retrieved successfully"));
});
export const UpdateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    question.set(req.body);

    await question.save();
    res.status(200).json(new ApiResponse(question, "Question updated successfully"));
});
export const UpdateAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate("patient", "-password")
        .populate("clinical", "-password");;

    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }
    appointment.actionPerformedBy = `${req.body.status} by  Admin`
    appointment.set({ status: req.body.status, reason: req.body.reason || "" });

    await appointment.save();
    const senders = []
    if (appointment?.clinical?.notification) {
        senders.push(appointment?.clinical?.device)
    }
    if (appointment?.patient?.notification) {
        senders.push(appointment?.patient?.device)
    }

    const mailTemp = {
        heading: "Appointment",
        patient: appointment.patient.fullName,
        message: `Your appointment status has been changed to ${req.body.status}.`,
        email: [
            appointment.clinical?.email || '',
            appointment.patient?.email || ''
        ],
        status: appointment.status,
        comment: appointment?.comment,
        feedback: appointment?.feedback || "",
        reason: appointment?.reason || "",
        startDate: moment(appointment.start).format("DD/MM/YYYY"),
        endDate: moment(appointment.end).format("DD/MM/YYYY"),
        startTime: moment(appointment.start).format("hh:mm A"),
        endTime: moment(appointment.end).format("hh:mm A"),
        clinician: appointment.clinical.fullName,
    };
    try {
        mailSender(mailTemp, "appointment")
        sendNotification([appointment?.clinical?.device, appointment?.patient?.device], `Appointment ${req.body.status}`, `Your appointment status is changed to ${req.body.status}  `)
    } catch (error) {
        console.log(error)
    }
    res.status(200).json(new ApiResponse(appointment, "Appointment updated successfully"));
});
export const BulkQuestionDelete = asyncHandler(async (req, res) => {
    await Question.deleteMany({});
    res.status(200).json(new ApiResponse(null, "All questions deleted successfully"));
});



export const createCategory = asyncHandler(async (req, res) => {
    const { title, image } = req.body;

    if (!title) {
        throw new ApiError(400, "Title is required");
    }

    const existingCategory = await Category.findOne({ title });

    if (existingCategory) {
        throw new ApiError(400, "Category with this title already exists");
    }

    const category = Category.create({ title, image });


    res.status(201).json(new ApiResponse(category, "Category created successfully"));
});

export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find();

    res.status(200).json(new ApiResponse(categories, "Categories retrieved successfully"));
});
export const getCategories = asyncHandler(async (req, res) => {
    let { search, skip = 0, count = 10, order, orderBy } = req.query;

    skip = parseInt(skip) || 0;
    count = parseInt(count) || 10;

    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } }
        ];
    }

    let categoriesQuery = Category.find(query).collation({ locale: "en" });
    if (orderBy && order) {
        const sortParams = {};
        sortParams[orderBy] = order === 'ASC' ? 1 : -1;
        categoriesQuery = categoriesQuery.sort(sortParams);
    }

    const totalCategories = await Category.countDocuments(query);

    categoriesQuery = categoriesQuery.skip(skip);

    const categories = await categoriesQuery.limit(count);
    res.status(200).json(new ApiResponse({ resp: categories, totalCount: totalCategories }, "Category retrieved successfully"));

});



export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    res.status(200).json(new ApiResponse(category, "Category retrieved successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, image } = req.body;

    if (!title) {
        throw new ApiError(400, "Title is required");
    }

    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    category.title = title;
    if (image && category.image && image !== category.image) {

        await deleteFile(category.image);

    }

    category.image = image;

    await category.save();

    res.status(200).json(new ApiResponse(category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    await category.remove();

    res.status(200).json(new ApiResponse({}, "Category deleted successfully"));
});
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    const headers = req.headers;
    const token = headers['x-token'];
    if (!token) {
        throw new ApiError(400, "Token is required");
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedToken || decodedToken.type !== "forgot" || decodedToken.email !== email) {
            throw new ApiError(401, "Invalid token");
        }

        console.log("Token is valid", decodedToken);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token has expired");
        } else {
            throw new ApiError(401, "Invalid token");
        }
    }




    const user = await Admin.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordMatch = await user.isPasswordMatch(password);
    if (isPasswordMatch) {
        throw new ApiError(401, "The new password must be different from the old password");
    }


    user.password = password;
    await user.save();
    const mailTemp = {
        email,
        message: `
    
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
         
        `,
        heading: "Password Changed",
        name: user?.fullName,
        type: "password"
    }

    try {
        mailSender(mailTemp);
    } catch (error) {
        console.log(error)
    }

    return res.status(200).json(new ApiResponse({}, "Password changed successfully"));
});

export const otpSender = asyncHandler(async (req, res) => {
    const { email, type } = req.body;
    if (!email || !validateEmail(email)) {
        throw new ApiError(400, "Invalid email address");
    }

    if (!type || !['forgot', 'verify'].includes(type)) {
        throw new ApiError(400, "Invalid type");
    }

    let user = await Admin.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const otp = await generateOTP(email, type, user);
    user.otp = JSON.stringify(otp);


    await user.save();
    return res.status(201).json(new ApiResponse(null, "OTP sent successfully"));
});
export const otpVerify = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (typeof otp !== 'string' || otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new ApiError(400, "Invalid OTP format");
    }

    const user = await Admin.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isOTPValid = validateOtp(user.otp, otp)
    const token = jwt.sign(
        {
            _id: user._id,
            email: user.email,
            type: "forgot"
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '5m' }  // Set expiration time to 5 minutes
    );

    if (isOTPValid) {
        user.otp = null;
        await user.save();
        return res.status(200).json(new ApiResponse(token, "OTP verification successful"));
    } else {
        throw new ApiError(400, "Invalid OTP");
    }
});


export const updateCurrentAdminDetails = asyncHandler(async (req, res) => {


    const { user } = req;
    if (!user || !user.email) {
        throw new ApiError(400, "User not authenticated");
    }

    const { firstName, lastName, image, systemGeneratedPass } = req.body;

    if (image && user?.image && image !== user?.image) {
        await deleteFile(user?.image)
    }
    const filter = { email: user.email };
    const update = {
        firstName,
        lastName,
        image,
        systemGeneratedPass

    };
    const options = { new: true, select: '-password' };

    const updatedUser = await Admin.findOneAndUpdate(filter, update, options);

    if (!updatedUser) {
        throw new ApiError(404, `User with email ${user.email} not found `);
    }


    return res.status(200).json(new ApiResponse(updatedUser, "Account updated successfully"));
});
export const automation = asyncHandler(async (req, res) => {



    const currentTime = new Date();

    const filter = {
        status: { $nin: ['cancelled', 'completed', "ongoing"] },
        end: { $lte: currentTime }
    };



    const update = {
        $set: { status: 'cancelled',reason:"Due to Inactivity",actionPerformedBy:"Automation" }
    };
    const result = await Appointment.updateMany(filter, update);
    return res.status(200).json(new ApiResponse(result, "Appointments updated successfully"));
});
export const updatePassword = asyncHandler(async (req, res) => {
    const { password, newPassword } = req.body;
    if (password === newPassword) {
        throw new ApiError(400, 'New password cannot be the same as the old password');
    }
    const user = req.user;
    const isPasswordValid = user.isPasswordMatch(password)
    if (!isPasswordValid) {
        throw new ApiError(400, "Old password not matched")
    }
    user.password = newPassword
    await user.save()
    const mailTemp = {
        email,
        message: `
    
            We are pleased to inform you that your password has been successfully changed. This is a confirmation that the change was completed securely and your account is now updated with the new password.
         
        `,
        heading: "Password Changed",
        name: user?.fullName,
        type: "password"
    }

    try {
        mailSender(mailTemp);
    } catch (error) {
        console.log(error)
    }
    return res.status(200).json(new ApiResponse(null, "Password updated successfully"));
})