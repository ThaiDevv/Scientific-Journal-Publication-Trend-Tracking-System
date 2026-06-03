import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
} from "antd";

import {
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await loginApi(values);

      localStorage.setItem(
        "token",
        response.data.token
      );

      message.success("Đăng nhập thành công");

      navigate("/dashboard");
    } catch (error) {
      message.error(
        "Sai tên đăng nhập hoặc mật khẩu"
      );
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
          maxWidth: 400,
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
            Academic Forum
          </Title>

          <Text type="secondary">
            Hệ thống diễn đàn học thuật
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
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

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message:
                  "Vui lòng nhập password",
              },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center" }}>
          <Text>
            Chưa có tài khoản?{" "}
            <Link to="/register">
              Đăng ký
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}

export default Login;