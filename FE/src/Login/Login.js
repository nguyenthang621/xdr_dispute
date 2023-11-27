import React, { useContext, useState } from 'react';
import axios from 'axios'
import './login.css'
import { AuthContext } from '../context/auth';
import { useNavigate } from 'react-router-dom';
import { message,Modal } from 'antd';
import hostPrefix from '../utils/config';
import { renderErrorMsg } from '../utils/messageNoti';
function Login(props) {
  const API_URL = props.API_URL
  const navigate  = useNavigate();
  const context = useContext(AuthContext);
	const [values, setValues]=useState({
	
		account:'',
		password:'',
     
	});

	const onChange= (event) => {
		setValues({...values,[event.target.name]:event.target.value})
	}
   
   const handleLogin = async (x) =>{
      try {
          const res = await axios({
            baseURL: API_URL,
            method: "POST",
            url: "/api/get_token",
            data: {
              username: values.account,
              password: values.password
            },
          });     
          if (res.status == 200) {
            
            context.login(res.data)
            navigate(`${hostPrefix}/dispute`) 
            message.success("Login successfully ")  
            
          }
        } catch (error) {
          renderErrorMsg(error)        
        }
  };
	

	const onSubmit = (event) =>{
		event.preventDefault();
    handleLogin();
	}
	

  return (
    <>
    <div className="main-content-login w-100 p-5">
        <div className="login-form-container">
          <div className="content">
            <img src="/static/xdr_image/XDR_logo.png" alt="header-image" className="cld-responsive" />
            {/* <h1 className="form-title">Login</h1> */}
            <form onSubmit={onSubmit}>
              <input type="text" placeholder="Username" name="account" value={values.account} onChange={onChange} />
              <input type="password" placeholder="Password" name="password" value={values.password} onChange={onChange} />

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  className="btlogin"
                  type="submit"
                  style={{ flex: 1, marginRight: "10px" }}
                >
                  Login
                </button>

                <button
                  className="btlogin"
                  onClick={(e) => {
                    e.preventDefault(); 
                    window.location.href = `${window.location.protocol}//${window.location.hostname}/service-control`;
                  }}
                  style={{ flex: 1, marginLeft: "10px" }}
                >
                  Management Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
