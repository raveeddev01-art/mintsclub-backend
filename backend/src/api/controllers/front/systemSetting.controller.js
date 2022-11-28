const SystemSetting = require('../../models/systemSetting.model')
const { HTTP_STATUS_CODE } = require('../../../config/constants')

const addSystemSetting = async (request, response) => {
    try {
        const { body } = request
        const settings = await SystemSetting.create(body)
        return response.status(HTTP_STATUS_CODE.OK).json(settings)
    } catch (error) {
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

const getSystemSetting = async (request, response) => {
    try {
        const data = await SystemSetting.findOne({})

        return response.status(HTTP_STATUS_CODE.OK).json(data)
    } catch (error) {
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

const updateSystemSetting = async (request, response) => {
    try {
        const { body } = request

        const checkAlreadyHaveSystemSettings = await SystemSetting.findOne({})
        if (!checkAlreadyHaveSystemSettings?._id) {
            const data = await SystemSetting.create(body)
            return response.status(HTTP_STATUS_CODE.OK).json(data)
        }
        const data = await SystemSetting.findOneAndUpdate({
            ...body,
            _id: checkAlreadyHaveSystemSettings?._id,
        })
        return response.status(HTTP_STATUS_CODE.OK).json(data)
    } catch (error) {
        return response.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json(error)
    }
}

module.exports = {
    addSystemSetting,
    getSystemSetting,
    updateSystemSetting,
}
