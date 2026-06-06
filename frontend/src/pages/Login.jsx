import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

const { Title, Text } = Typography;

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const onFinish = async (values) => {
        try {
            const res = await loginApi(values);
            const authData = res.data.body;

            // Dùng login() từ AuthContext để cập nhật state toàn cục
            login(authData.token, {
                username: authData.username,
                role: authData.role,
            });

            message.success("Đăng nhập thành công!");
            navigate("/dashboard", { replace: true });
        } catch (error) {
            console.error(error);
            message.error(
                error?.response?.data?.message ||
                    "Sai tên đăng nhập hoặc mật khẩu"
            );
        }
    };
    return (
        <div className="auth-page">
            <Card className="auth-card">
                <div className="academic-logo">
                    <div className="logo-circle">🎓</div>

                    <Title level={2}>Academic Forum</Title>

                    <Text>
                        Scientific Journal Publication Trend Tracking System
                    </Text>
                </div>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập tên đăng nhập",
                            },
                        ]}
                    >
                        <Input
                            size="large"
                            prefix={<UserOutlined />}
                            placeholder="Tên đăng nhập"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng nhập mật khẩu",
                            },
                        ]}
                    >
                        <Input.Password
                            size="large"
                            prefix={<LockOutlined />}
                            placeholder="Mật khẩu"
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                    >
                        Đăng nhập
                    </Button>

                    <div className="terms">
                        Bằng việc đăng nhập, bạn đồng ý với
                        <a href="#"> Điều khoản sử dụng </a>
                        và
                        <a href="#"> Chính sách bảo mật</a>.
                    </div>

                    <div className="auth-footer">
                        <span>Chưa có tài khoản?</span>
                        <Link to="/register">Đăng ký</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

export default Login;