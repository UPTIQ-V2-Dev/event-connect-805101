import { dashboardService } from "../services/index.js";
import catchAsyncWithAuth from "../utils/catchAsyncWithAuth.js";
import httpStatus from 'http-status';
const getStats = catchAsyncWithAuth(async (req, res) => {
    // req.user is available from auth middleware via catchAsyncWithAuth
    const userId = req.user.id;
    const stats = await dashboardService.getDashboardStats(userId);
    res.status(httpStatus.OK).send(stats);
});
export default {
    getStats
};
