import {  message } from 'antd';

export const renderErrorMsg = (error) => {
    const defaultMsg = "Error! An error occurred. Please try again later!"
    try {
        message.error(error.response.data.error_detail?error.response.data.error_detail:defaultMsg);
      } catch (error) {
        message.error(defaultMsg);
    }
}

export default renderErrorMsg;