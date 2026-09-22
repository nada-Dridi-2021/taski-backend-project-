
const allowedRoles = ['member', 'admin','leader'];

const verifyRoles = (...rolesToCheck) => {
    return (req, res, next) => {
        const userRoles = req.user?.role;
            if (!userRoles.some(role => rolesToCheck.includes(role))){
                return res.status(403).json({message: "Access denied"});
            }
            next();
    };
};

module.exports = {verifyRoles, allowedRoles};