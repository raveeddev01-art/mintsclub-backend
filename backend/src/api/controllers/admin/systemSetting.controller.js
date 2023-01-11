// const { HTTP_STATUS_CODE } = require("../configs/constants");
const SystemSetting = require('../../models/systemSetting.model')

const addSystemSetting = async (request, response) => {
    try {
        const { body } = request
        const data = new SystemSetting(body)

        return response.status(200).json(data)
    } catch (error) {
        return response.status(500).json(error)
    }
}

const getSystemSetting = async (request, response) => {
    try {
        const data = await SystemSetting.findOne({})
        return response.status(200).json(data)
    } catch (error) {
        return response.status(500).json(error)
    }
}

const updateSystemSetting = async (request, response) => {
    try {
        const { body } = request

        const checkAlreadyHaveSystemSettings = await SystemSetting.findOne({})
        if (!checkAlreadyHaveSystemSettings?._id) {
            const data = new SystemSetting(body)
            await data.save()
            return response.status(200).json(data)
        }

        const data = await SystemSetting.findOneAndUpdate(
            {
                _id: checkAlreadyHaveSystemSettings._id,
            },
            {
                $set: { ...body },
            }
        )

        return response.status(200).json(data)
    } catch (error) {
        return response.status(500).json(error)
    }
}

module.exports = {
    addSystemSetting,
    getSystemSetting,
    updateSystemSetting,
}
