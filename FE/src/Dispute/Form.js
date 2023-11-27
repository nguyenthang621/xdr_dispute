import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Button,
  DatePicker,
  Form,
  Select,
  InputNumber,
  Modal,
  Table,
  message,
} from "antd";
import moment from "moment";
import Papa from "papaparse";
import "./form.css";
import { filterCondition, CODE, CODE_NAME } from "./formConstants";
import hostPrefix from "../utils/config";
import renderErrorMsg from "../utils/messageNoti";

const { RangePicker } = DatePicker;

export default function SubmitForm(props) {
  const token = props.token;
  const API_URL = props.API_URL;
  const [client, setClient] = useState([{}]);
  const [account, setAccount] = useState([{}]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .post(API_URL + "/api/list_client", {
        token: localStorage.getItem("xdr_dispute_token"),
      })
      .then((res) => {
        setClient(res.data);
      })
      .catch((error) => {
        renderErrorMsg(error);
      });
  }, []);

  useEffect(() => {
    axios
      .post(API_URL + "/api/list_account", {
        token: localStorage.getItem("xdr_dispute_token"),
      })
      .then((res) => {
        setAccount(res.data);
      })
      .catch((error) => {
        renderErrorMsg(error);
      });
  }, []);

  const [filters, setFilter] = useState({
    origin: "orig",
    billed_clients_id: null,
    billed_accounts_id: null,
    date: [null, null],
    rates_dst_code_name: null,
    rates_dst_code: null,
  });

  const [optionalFilter, setOptionalFilter] = useState({
    subscriber_host: null,
    subscriber_id: null,
  });

  const [optionParams, setOptionParams] = useState({
    src_number: null,
    dst_number: null,
    connect_time_offset: 0,
    volume_offset: 0,
  });

  const onSubcriberHostChange = (val) => {
    setOptionalFilter({ ...optionalFilter, subscriber_host: val });
  };

  const onSubcriberIDChange = (val) => {
    setOptionalFilter({ ...optionalFilter, subscriber_id: val });
  };

  const onClientChange = (val) => {
    setFilter({ ...filters, billed_clients_id: val });
  };

  const onAccountChange = (val) => {
    setFilter({ ...filters, billed_accounts_id: val });
  };

  const onOriginChange = (val) => {
    setFilter({ ...filters, origin: val });
  };

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

  const onClientClear = () => {
    setFilter({ ...filters, billed_clients_id: null });
  };

  const onAccountClear = () => {
    setFilter({ ...filters, billed_accounts_id: null });
  };

  const onCodeNameChange = (val) => {
    setFilter({ ...filters, rates_dst_code_name: val });
  };

  const onCodeNameClear = () => {
    setFilter({ ...filters, rates_dst_code: null });
    setFilter({ ...filters, rates_dst_code_name: null });
  };

  const onCodeChange = (val) => {
    setFilter({ ...filters, rates_dst_code: val });
  };

  const onCodeClear = () => {
    setFilter({ ...filters, rates_dst_code: null });
  };

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    setLoading(true);
    if (!selectedFile) {
      message.error("Please upload your file!");
    } else if (!filters.billed_accounts_id && !filters.billed_clients_id) {
      message.error("Please select a client or account!");
    } else if (!filters.date[0] || !filters.date[1]) {
      message.error("Please select start and end dates!");
    } else {
      const formData = new FormData();
      formData.append("xdr_file", selectedFile, selectedFile["name"]);
      formData.append(
        "data",
        JSON.stringify({
          token: localStorage.getItem("xdr_dispute_token"),
          filter: filters,
          optional_filter: optionalFilter,
          option: optionParams,
          required_field: requiredFieldSelect,
        })
      );
      const requestOptions = {
        method: "POST",
        body: formData,
        redirect: "follow",
      };

      try {
        const res = await fetch(API_URL + "/api/dispute_xdr", requestOptions);
        if (res.ok) {
          const data = await res.json();
          navigate(`${hostPrefix}/dispute-detail/` + data);
        } else {
          const error = await res.json();
          message.error(
            error.error_detail
              ? error.error_detail
              : "Error! An error occurred. Please try again later!"
          );
        }
      } catch (error) {
        setLoading(false);
        message.error("Error! An error occurred. Please try again later!");
      }
    }
    setLoading(false);
  };

  const onRangeOK = (value) => {
    const start_time = value[0] ? value[0].format("YYYY-MM-DD HH:mm:ss") : null;
    const stop_time = value[1] ? value[1].format("YYYY-MM-DD HH:mm:ss") : null;
    setFilter({ ...filters, date: [start_time, stop_time] });
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [columns, setColumns] = useState([]);

  const [requiredField, setRequiredField] = useState(filterCondition);
  const [requiredFieldSelect, setRequiredFieldSelect] = useState({});

  const onRequiredChange = (val) => {
    const index_val = String(val).split(".");
    const updatedDictionary = { ...requiredFieldSelectRef.current };
    if (updatedDictionary.hasOwnProperty(`select_col_${index_val[0]}`)) {
      updatedDictionary[`select_col_${index_val[0]}`] = index_val[1];
    } else {
      updatedDictionary[`select_col_${index_val[0]}`] = index_val[1];
    }
    setRequiredFieldSelect(updatedDictionary);
  };

  const requiredFieldSelectRef = useRef(requiredFieldSelect);
  requiredFieldSelectRef.current = requiredFieldSelect;

  const checkRequiredFieldSelect = () => {
    const occurrences = {};
    for (const [key, value] of Object.entries(requiredFieldSelectRef.current)) {
      occurrences[value] = (occurrences[value] || 0) + 1;
    }
    for (const element of filterCondition) {
      if (!(element in occurrences) || occurrences[element] != 1) {
        return false;
      }
    }
    return true;
  };

  const onFileChange = (event) => {
    try {
      setSelectedFile(event.target.files[0]);
      Papa.parse(event.target.files[0], {
        header: false,
        skipEmptyLines: true,
        complete: function (results) {
          const data = results.data.slice(0, 5);
          setColumns(
            data[0].map((item, index) => {
              return {
                title: (
                  <Select
                    allowClear={true}
                    key={`filter_select_${index}`}
                    className="required-select-ele"
                    defaultValue={"Select field"}
                    options={requiredField.map((val) => {
                      return {
                        label: val,
                        value: `${index}.${val}`,
                      };
                    })}
                    value={requiredFieldSelect[`select_col_${index}`]}
                    onChange={onRequiredChange}
                    onClear={(val) => {
                      const newState = requiredFieldSelectRef.current;
                      if (newState.hasOwnProperty(`select_col_${index}`)) {
                        delete newState[`select_col_${index}`];
                        setRequiredFieldSelect(newState);
                      }
                    }}
                  />
                ),
                render: (text, record) => {
                  return <div>{record[index]}</div>;
                },
              };
            })
          );
          setFileData(data);
          document.getElementById("select-required-fields").click();
        },
      });
    } catch {
      message.error("Error! An error occurred. Please try again later!");
    }
  };

  const modalBodyStyle = {
    padding: "24px",
    overflow: "auto",
  };

  const showSelectField = () => {
    Modal.confirm({
      title: "Please select required field",
      width: "80%",
      cancelButtonProps: { disabled: true, hidden: true },
      bodyStyle: modalBodyStyle,
      content: (
        <>
          <Table
            style={{ overflow: "auto" }}
            pagination={false}
            columns={columns}
            dataSource={fileData}
          />
        </>
      ),
      onOk() {
        if (!checkRequiredFieldSelect() && fileData.length) {
          message.error("Please select one column for each required field");
          return Promise.reject("Please select 1 column for 1 required field");
        }
        return Promise.resolve();
      },
    });
  };

  const validateInteger = (_, value) => {
    if (value && !Number.isInteger(value)) {
      return Promise.reject(new Error("Please enter an integer value"));
    }
    return Promise.resolve();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "deleted":
        return "deleted-account";
      case "stopped":
        return "stopped-account";
      default:
        return "active-account";
    }
  };

  const appendStatus = (label, status) => {
    switch (status) {
      case "deleted":
        return label + " [deleted]";
      case "stopped":
        return label + " [stopped]";
      default:
        return label;
    }
  };

  return (
    <>
      <div className="main-content-dispute-form">
        <h1 className="form-header">xDR Dispute</h1>

        <div className="form-container">
          <div className="form-left">
            <h3 className="form-title">Filter properties</h3>
            <Form
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 14 }}
              layout="horizontal"
              labelAlign="left"
            >
              <Form.Item label="Client">
                <Select
                  allowClear={true}
                  value={filters.billed_clients_id}
                  showSearch
                  style={{ width: 300 }}
                  placeholder="Search to filter"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "").includes(input)
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={client.map((item) => {
                    return {
                      label: appendStatus(item["name"], item["status"]),
                      value: item["id"],
                      className: getStatusClass(item["status"]),
                    };
                  })}
                  onChange={onClientChange}
                  onClear={onClientClear}
                  disabled={filters.billed_accounts_id != null}
                />
              </Form.Item>

              <Form.Item label="Account">
                <Select
                  dropdownClassName="select-label"
                  allowClear={true}
                  value={filters.billed_accounts_id}
                  showSearch
                  style={{ width: 300 }}
                  placeholder="Search to filter"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "").includes(input)
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                  options={account.map((item) => {
                    return {
                      label: item["clients_name"] + " / " + item["name"],
                      value: +item["id"],
                    };
                  })}
                  onChange={onAccountChange}
                  onClear={onAccountClear}
                  disabled={filters.billed_clients_id != null}
                />
              </Form.Item>
              <div className="hide-arrows">
                <Form.Item
                  label="Subscriber host"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    onChange={(e) => onSubcriberHostChange(e.target.value)}
                    style={{ width: 300 }}
                    value={optionalFilter.subscriber_host}
                  />
                </Form.Item>

                <Form.Item
                  label="Subcriber ID"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    onChange={(e) => onSubcriberIDChange(e.target.value)}
                    style={{ width: 300 }}
                    value={optionalFilter.subscriber_id}
                  />
                </Form.Item>
              </div>
              <Form.Item label="Type">
                <Select
                  value={filters.origin}
                  style={{ width: 200 }}
                  onChange={onOriginChange}
                >
                  <Select.Option value="orig">Origination</Select.Option>
                  <Select.Option value="term">Termination</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Code Name">
                <Select
                  allowClear={true}
                  value={filters.rates_dst_code_name}
                  style={{ width: 200 }}
                  options={CODE_NAME.map((item) => {
                    return { label: item, value: item };
                  })}
                  onChange={onCodeNameChange}
                  onClear={onCodeNameClear}
                  showSearch
                  placeholder="Search to filter"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.label ?? "").includes(input)
                  }
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? "")
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? "").toLowerCase())
                  }
                />
              </Form.Item>

              <Form.Item label="Code">
                <Select
                  allowClear={true}
                  value={filters.rates_dst_code}
                  style={{ width: 90 }}
                  options={
                    filters.rates_dst_code_name
                      ? CODE[filters.rates_dst_code_name].map((item) => {
                          return { label: item, value: item };
                        })
                      : null
                  }
                  disabled={filters.rates_dst_code_name == null}
                  onChange={onCodeChange}
                  onClear={onCodeClear}
                />
              </Form.Item>

              <Form.Item label="Period">
                <RangePicker
                  className="custom-antd-dp"
                  allowClear={false}
                  showTime={{ format: "HH:mm:ss" }}
                  format="YYYY-MM-DD HH:mm:ss"
                  onOk={onRangeOK}
                  value={
                    "date" in filters
                      ? filters.date.map((item) => {
                          return item
                            ? moment(item, "YYYY-MM-DD HH:mm:ss")
                            : null;
                        })
                      : null
                  }
                />
              </Form.Item>

              <Form.Item label="Select file">
                <input type="file" accept=".csv" onChange={onFileChange} />
                <br />
                <Button
                  onClick={showSelectField}
                  hidden={true}
                  id={"select-required-fields"}
                  danger
                >
                  Change required columns
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="form-right">
            <div>
              <h3 className="form-title">Comparation offset</h3>
              <Form
                labelCol={{ span: 7 }}
                wrapperCol={{ span: 14 }}
                layout="horizontal"
                labelAlign="left"
              >
                <Form.Item
                  rules={[{ validator: validateInteger }]}
                  label="SRC party id"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 14 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <InputNumber
                    min={1}
                    onChange={onSrcChange}
                    value={optionParams.src_number}
                  />
                </Form.Item>

                <Form.Item
                  rules={[{ validator: validateInteger }]}
                  label="DST party id"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 14 }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <InputNumber
                    min={1}
                    onChange={onDstChange}
                    value={optionParams.dst_number}
                  />
                </Form.Item>

                <Form.Item
                  rules={[{ validator: validateInteger }]}
                  label="Connect time"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 14 }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <InputNumber
                    min={0}
                    defaultValue={0}
                    onChange={onConnectTimeChange}
                    value={optionParams.connect_time_offset}
                  />
                </Form.Item>

                <Form.Item
                  rules={[{ validator: validateInteger }]}
                  label="Volume"
                  labelCol={{ span: 7 }}
                  wrapperCol={{ span: 14 }}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <InputNumber
                    min={0}
                    defaultValue={0}
                    onChange={onVolumeChange}
                    value={optionParams.volume_offset}
                  />
                </Form.Item>
              </Form>
            </div>
            <div className="btn-submit">
              <Button
                size="large"
                type="primary"
                htmlType="submit"
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
