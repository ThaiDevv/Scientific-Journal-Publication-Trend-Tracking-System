import { useState, useEffect } from "react";
import { Form, Input, Button, Typography, message } from "antd";
import {
    UserOutlined,
    LockOutlined,
    ReadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

import art1 from "../assets/journal_art_1.png";
import art2 from "../assets/journal_art_2.png";
import art3 from "../assets/journal_art_3.png";
import art4 from "../assets/journal_art_4.png";

const { Title, Text } = Typography;

function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const images = [art1, art2, art3, art4];

    const [currentImage, setCurrentImage] = useState(0);

    // Tự động chuyển hướng sang dashboard nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const onFinish = async (values) => {
        try {
            const res = await loginApi(values);

            const authData = res.data.body;

            // Cập nhật trạng thái đăng nhập vào AuthContext
            login(authData.token, {
                username: authData.username,
                role: authData.role,
            });

            message.success("Login Successful!");

            navigate("/dashboard");
        } catch (error) {
            console.error(error);

            message.error(
                error?.response?.data?.message ||
                "Wrong username or password!"
            );
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-left">
                    <div className="login-content">
                        <div className="logo-section">
                            <div className="logo-circle">
                                <ReadOutlined />
                            </div>

                            <div>
                                <h2 className="logo-title">
                                    Academic Forum
                                </h2>

                                <p className="logo-subtitle">
                                    Scientific Journal Publication
                                    Trend Tracking System
                                </p>
                            </div>
                        </div>

                        <Title level={1} className="welcome-title">
                            Welcome Back 👋
                        </Title>

                        <Text className="welcome-text">
                            Sign in to access research papers,
                            publication analytics and academic
                            collaboration tools.
                        </Text>

                        <Form
                            layout="vertical"
                            onFinish={onFinish}
                            className="login-form"
                        >
                            <Form.Item
                                label="Username"
                                name="username"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter your username!",
                                    },
                                ]}
                            >
                                <Input
                                    size="large"
                                    prefix={<UserOutlined />}
                                    placeholder="Enter your username"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please enter your password!",
                                    },
                                ]}
                            >
                                <Input.Password
                                    size="large"
                                    prefix={<LockOutlined />}
                                    placeholder="Enter your password"
                                />
                            </Form.Item>

                            <div className="forgot-row">
                                <a href="#">Forgot Password?</a>
                            </div>

                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                className="signin-btn"
                            >
                                Sign In
                            </Button>
                        </Form>

                        <div className="signup-link">
                            Don't have an account?{" "}
                            <Link to="/register">
                                Sign up
                            </Link>
                        </div>

                        <div className="terms">
                            By signing in, you agree to our
                            <a href="#"> Terms of Service </a>
                            and
                            <a href="#"> Privacy Policy</a>.
                        </div>

                        <div className="copyright">
                            © 2026 Academic Forum.
                            All rights reserved.
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <div className="slider-wrapper">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`slide-${index}`}
                                className={
                                    index === currentImage
                                        ? "slider-image active"
                                        : "slider-image"
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;