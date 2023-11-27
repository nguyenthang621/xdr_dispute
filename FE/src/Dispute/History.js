import "antd/dist/antd.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Input, Button, Space } from "antd";
import Highlighter from "react-highlight-words";
import { SearchOutlined } from "@ant-design/icons";
import { message } from "antd";
import columns from "./historyConfig";
import hostPrefix from "../utils/config";
import { renderErrorMsg } from "../utils/messageNoti";
import "./history.css";
export default function History(props) {
  const [searchText, setsearchText] = useState("");
  const [searchedColumn, setsearchedColumn] = useState("");
  const [searchInput, setsearchInput] = useState("");
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            setsearchInput(node);
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex]
            .toString()
            .toLowerCase()
            .includes(value.toLowerCase())
        : "",

    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setsearchText(selectedKeys[0]);
    setsearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setsearchText("");
  };

  const token = props.token;
  const API_URL = props.API_URL;
  const [disputeHistory, setDisputeHistory] = useState([{}]);

  useEffect(() => {
    axios
      .post(API_URL + "/api/dispute_history", {
        token: localStorage.getItem("xdr_dispute_token"),
      })
      .then((res) => {
        setDisputeHistory(res.data);
      })
      .catch((error) => {
        renderErrorMsg(error);
      });
  }, []);

  const handleRemove = async (id) => {
    try {
      const res = await axios({
        baseURL: API_URL,
        method: "DELETE",
        url: "/api/remove_dispute/" + String(id),
        data: {
          token: localStorage.getItem("xdr_dispute_token"),
        },
      });

      if (res.status == 200) {
        const updatedList = disputeHistory.filter((item) => item["id"] !== id);
        setDisputeHistory(updatedList);
        message.success("Success");
      }
    } catch (error) {
      renderErrorMsg(error);
    }
  };

  return (
    <div className="main-content">
      <h1 className="form-title">Dispute History</h1>
      <Table
        className="ant-table-result custom-table"
        columns={columns(handleRemove, getColumnSearchProps)}
        dataSource={disputeHistory.reverse()}
      />
    </div>
  );
}
