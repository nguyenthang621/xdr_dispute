import React, { useContext, useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import { AuthContext } from "../context/auth";
import {
  HistoryOutlined,
  LogoutOutlined,
  BarChartOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import "./navigate.css";
import hostPrefix from "../utils/config";
const { Sider } = Layout;

export default function Navigate(props) {
  const { logout } = useContext(AuthContext);
  const [selectedKey, setSelectedKey] = useState("home");
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("collapsed") === "true" || false
  );
  // console.log("selectedKey", selectedKey.includes("history"));
  const location = useLocation();

  // useEffect(() => {
  //   refreshToken(API_URL);

  //   const intervalId = setInterval(() => {
  //     refreshToken(API_URL);
  //   }, tokenRefreshInterval);

  //   const expirationTimer = setTimeout(() => {
  //     clearInterval(intervalId);
  //   }, tokenExpirationDuration);

  //   return () => {
  //     clearInterval(intervalId);
  //     clearTimeout(expirationTimer);
  //   };
  // }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    setSelectedKey(currentPath.substring(1));
  }, [location]);

  useEffect(() => {
    localStorage.setItem("collapsed", collapsed); // Save the collapsed state to localStorage
  }, [collapsed]);

  const handleMenuClick = (key) => {
    setSelectedKey(key);
  };

  const toggleCollapsed = () => {
    setCollapsed((prevCollapsed) => !prevCollapsed);
  };

  const menuStyle = {
    color: "#ffffff",
    fontSize: "16px",
  };

  const selectedMenuStyle = {
    ...menuStyle,
    color: "#000000",
  };

  return (
    <Sider className="side-bar" theme="light" collapsed={collapsed}>
      <div className="menu-wrapper">
        <div className="collapse-button" onClick={toggleCollapsed}>
          <MenuOutlined style={{ ...menuStyle }} />
        </div>
        <Menu
          className="menu-wrapper-ind"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={(e) => handleMenuClick(e.key)}
        >
          <Menu.Item
            key="xdr-dispute"
            icon={
              <BarChartOutlined
                style={
                  selectedKey.includes("xdr-dispute")
                    ? menuStyle
                    : selectedMenuStyle
                }
              />
            }
          >
            <Link
              to={`${hostPrefix}/dispute`}
              style={
                selectedKey.includes("xdr-dispute")
                  ? menuStyle
                  : selectedMenuStyle
              }
            >
              xDR Dispute
            </Link>
          </Menu.Item>
          <Menu.Item
            key="history"
            icon={
              <HistoryOutlined
                style={
                  selectedKey === "history" ? selectedMenuStyle : menuStyle
                }
              />
            }
          >
            <Link
              to={`${hostPrefix}/history`}
              style={selectedKey === "history" ? selectedMenuStyle : menuStyle}
            >
              History
            </Link>
          </Menu.Item>
          <Menu.Item
            key="settings"
            icon={<LogoutOutlined style={{ ...menuStyle }} />}
          >
            <a href="#" onClick={logout} style={{ ...menuStyle }}>
              Logout
            </a>
          </Menu.Item>
        </Menu>
      </div>
    </Sider>
  );
}
