import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
} from "antd";

import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";

import { registerApi } from "../api/authApi";

const { Title, Text } = Typography;

const { Option } = Select;

function Register() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      // Gọi API register
      await registerApi(values);

      message.success("Đăng ký thành công!");

      // Redirect login
      navigate("/login");
    } catch (error) {
      // Mock xử lý lỗi
      if (
        error.response?.data?.message ===
        "Username already exists"
      ) {
        message.error("Username đã tồn tại");
      } else if (
        error.response?.data?.message ===
        "Email already exists"
      ) {
        message.error("Email đã tồn tại");
      } else {
        message.error("Đăng ký thất bại");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 450,
          borderRadius: 12,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <Title level={2}>
            Register Account
          </Title>

          <Text type="secondary">
            Tạo tài khoản hệ thống
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
        >
          {/* Username */}
          <Form.Item
            label="Username"
            name="username"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập username",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Username"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập email",
              },
              {
                type: "email",
                message:
                  "Email không hợp lệ",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          {/* Full Name */}
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập họ tên",
              },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Full Name"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập password",
              },
              {
                min: 6,
                message:
                  "Password tối thiểu 6 ký tự",
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          {/* Confirm Password */}
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message:
                  "Vui lòng xác nhận mật khẩu",
              },

              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue(
                      "password"
                    ) === value
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "Mật khẩu không khớp"
                    )
                  );
                },
              }),
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
          </Form.Item>

          {/* Role */}
          <Form.Item
            label="Role"
            name="role"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng chọn role",
              },
            ]}
          >
            <Select
              size="large"
              placeholder="Select role"
            >
              <Option value="RESEARCHER">
                RESEARCHER
              </Option>

              <Option value="LECTURER">
                LECTURER
              </Option>

              <Option value="STUDENT">
                STUDENT
              </Option>
            </Select>
          </Form.Item>

          {/* Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        {/* Link Login */}
        <div style={{ textAlign: "center" }}>
          <Text>
            Đã có tài khoản?{" "}
            <Link to="/login">
              Đăng nhập
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default Register;