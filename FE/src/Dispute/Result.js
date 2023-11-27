import "antd/dist/antd.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form, InputNumber, message } from "antd";
import { useParams } from "react-router-dom";
import { columns, renderResultTags } from "./resultConfig";
import { renderErrorMsg } from "../utils/messageNoti";
export default function Result(props) {
  console.log("detail--------------");
  const token = props.token;
  const API_URL = props.API_URL;
  const { id } = useParams();
  const [resultData, setResultData] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(50);
  const [totalResult, setTotalResult] = useState(1);

  const [optionParams, setOptionParams] = useState({
    src_number: null,
    dst_number: null,
    connect_time_offset: 0,
    volume_offset: 0,
  });

  const onSrcChange = (val) => {
    setOptionParams({ ...optionParams, src_number: val });
  };

  const onDstChange = (val) => {
    setOptionParams({ ...optionParams, dst_number: val });
  };

  const onConnectTimeChange = (val) => {
    setOptionParams({ ...optionParams, connect_time_offset: val });
  };

  const onVolumeChange = (val) => {
    setOptionParams({ ...optionParams, volume_offset: val });
  };

  const fetchRecords = (page, pageSize) => {
    setLoading(true);
    axios
      .post(
        API_URL + "/api/show_xdr_result/",
        { token: localStorage.getItem("xdr_dispute_token") },
        {
          params: {
            id: id,
            page: page,
            num_per_page: pageSize,
          },
        }
      )
      .then((res) => {
        setResultData(res.data.result);
        setOptionParams(res.data.option);
        setTotalResult(res.data.total);
        setLoading(false);
      })
      .catch((error) => {
        renderErrorMsg(error);
      });
  };

  useEffect(() => {
    fetchRecords(1, pageSize);
  }, []);

  const handleDownload = () => {
    const config = {
      responseType: "blob",
    };
    axios
      .post(
        API_URL + `/api/download_result/${id}`,
        { token: localStorage.getItem("xdr_dispute_token") },
        config
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "data.csv");
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => {
        renderErrorMsg(error);
      });
  };

  const [searchText, setsearchText] = useState("");
  const [searchedColumn, setsearchedColumn] = useState("");
  const [searchInput, setsearchInput] = useState("");

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setsearchText(selectedKeys[0]);
    setsearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setsearchText("");
  };

  const handleSubmit = async (event) => {
    try {
      setLoading(true);
      const res = await axios({
        baseURL: API_URL,
        method: "POST",
        url: "/api/edit_xdr_result/",
        data: {
          token: localStorage.getItem("xdr_dispute_token"),
          option: optionParams,
        },
        params: {
          id: id,
        },
      });
      if (res.status == 200) {
        window.location.reload();
        setLoading(false);
        message.success("Update successfully");
      }
    } catch (error) {
      renderErrorMsg(error);
    }
  };
  const validateInteger = (_, value) => {
    if (value && !Number.isInteger(value)) {
      return Promise.reject(new Error("Please enter an integer value"));
    }
    return Promise.resolve();
  };
  const [currentPage, setCurrentPage] = useState(1);
  // Table columns
  const columns = [
    {
      title: "Index",
      width: "1%",
      render: (_, __, rowIndex) => {
        if (resultData === null) {
          return <span>Loading...</span>;
        }
        const pageStartIndex = (currentPage - 1) * pageSize;
        const pageIndex = pageStartIndex + rowIndex + 1;
        return <span>{pageIndex}</span>;
      },
    },
    {
      title: "Result",
      dataIndex: "result",
      key: "rs",
      width: "1%",
      render: (text) => renderResultTags(text),
    },
    {
      width: "15%",
      title: "SRC Party ID",
      dataIndex: "src_party_id_ext_local",
      key: "src_party_id_ext_local",
      // ...getColumnSearchProps('src_party_id_ext_local'),
      render: (text, record) => {
        let local = text ? text : "No matched record";
        let ext = record["src_party_id_ext_ext"]
          ? record["src_party_id_ext_ext"]
          : "No matched record";
        return (
          <div>
            {local}
            <br />
            {ext}
          </div>
        );
      },
    },
    {
      title: "DST Party ID",
      dataIndex: "dst_party_id_ext_local",
      width: "15%",
      key: "dst_party_id_ext_local",
      //   ...getColumnSearchProps('dst_party_id_ext_local'),
      render: (text, record) => {
        let local = text ? text : "null";
        let ext = record["dst_party_id_ext_ext"]
          ? record["dst_party_id_ext_ext"]
          : "null";
        return (
          <div>
            {local}
            <br />
            {ext}
          </div>
        );
      },
    },

    {
      title: "Connect Time",
      dataIndex: "start_time_local",
      width: "20%",
      key: "start_time_local",
      render: (text, record) => {
        let local = text ? text : "null";
        let ext = record["start_time_ext"] ? record["start_time_ext"] : "null";
        return (
          <div>
            {local}
            <br />
            {ext}
          </div>
        );
      },
    },

    {
      title: "Finish Time",
      dataIndex: "stop_time_local",
      width: "20%",
      key: "stop_time",
      render: (text, record) => {
        let local = text ? text : "null";
        let ext = record["stop_time_ext"] ? record["stop_time_ext"] : "null";
        return (
          <div>
            {local}
            <br />
            {ext}
          </div>
        );
      },
    },

    {
      title: "Volume",
      dataIndex: "volume_local",
      width: "10%",
      key: "volume_local",
      render: (text, record) => {
        let local = parseInt(text) >= 0 ? text : "null";
        let ext = record["volume_ext"] ? record["volume_ext"] : "null";
        return (
          <div>
            {local}
            <br />
            {ext}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="main-content">
        <h1 className="form-title">Dispute Result</h1>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Form layout="inline" onFinish={handleSubmit}>
            <Form.Item
              label="SRC ID offset"
              rules={[{ validator: validateInteger }]}
            >
              <InputNumber
                min={1}
                onChange={onSrcChange}
                value={optionParams.src_number}
              />
            </Form.Item>

            <Form.Item
              label="DST ID offset"
              rules={[{ validator: validateInteger }]}
            >
              <InputNumber
                min={1}
                onChange={onDstChange}
                value={optionParams.dst_number}
              />
            </Form.Item>

            <Form.Item
              label="Connect time"
              rules={[{ validator: validateInteger }]}
            >
              <InputNumber
                min={0}
                defaultValue={0}
                onChange={onConnectTimeChange}
                value={optionParams.connect_time_offset}
              />
            </Form.Item>

            <Form.Item label="Volume" rules={[{ validator: validateInteger }]}>
              <InputNumber
                min={0}
                defaultValue={0}
                onChange={onVolumeChange}
                value={optionParams.volume_offset}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>

          <Button type="primary" onClick={handleDownload}>
            Download Result
          </Button>
        </div>
        <div style={{ margin: "20px 0" }} />
        {
          <Table
            className="ant-table-result"
            columns={columns}
            dataSource={resultData || []}
            pagination={{
              current: currentPage,
              onChange: (page, pageSize) => {
                fetchRecords(page, pageSize);
                setCurrentPage(page);
              },
              pageSize: pageSize,
              pageSizeOptions: [25, 50, 100],
              showSizeChanger: true,
              onShowSizeChange: (current, pageSize) => {
                setPageSize(pageSize);
              },
              total: totalResult,
            }}
            loading={loading}
          />
        }
      </div>
    </>
  );
}
