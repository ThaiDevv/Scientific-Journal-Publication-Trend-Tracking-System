import { useState, useEffect } from "react";
import art1 from "../assets/journal_art_1.png";
import art2 from "../assets/journal_art_2.png";
import art3 from "../assets/journal_art_3.png";
import art4 from "../assets/journal_art_4.png";
import {
    Form,
    Input,
    Button,
    Typography,
    Select,
    message,
    Row,
    Col,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { ReadOutlined } from "@ant-design/icons";
import { registerApi } from "../api/authApi";

const { Title, Text } = Typography;

function Register() {
    const navigate = useNavigate();

    const images = [
        art1,
        art2,
        art3,
        art4,
    ];

    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
            );
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const onFinish = async (values) => {
        try {
            await registerApi({
                username: values.username,
                email: values.email,
                fullName: values.fullName,
                password: values.password,
                role: values.role,
            });

            message.success("Đăng ký thành công!");
            navigate("/login");
        } catch (error) {
            message.error(
                error?.response?.data?.message ||
                "Username hoặc Email đã tồn tại"
            );
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">

                <div className="login-left">
                    <div className="login-content register-content">

                        <div className="logo-section">
                            <div className="logo-circle">
                                <ReadOutlined />
                            </div>

                            <div>
                                <h2 className="logo-title">
                                    Academic Forum
                                </h2>

                                <p className="logo-subtitle">
                                    Scientific Journal Publication Trend Tracking System
                                </p>
                            </div>
                        </div>

                        <Title level={1}>
                            Create Account 🚀
                        </Title>

                        <Text className="welcome-text">
                            Create your account and join the academic community.
                        </Text>

                        <Form
                            layout="vertical"
                            onFinish={onFinish}
                            className="register-form"
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="username"
                                        label="Username"
                                        rules={[{ required: true }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="email"
                                        label="Email"
                                        rules={[
                                            {
                                                required: true,
                                                type: "email",
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="fullName"
                                label="Full Name"
                                rules={[{ required: true }]}
                            >
                                <Input />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="password"
                                        label="Password"
                                        rules={[
                                            {
                                                required: true,
                                                min: 6,
                                            },
                                        ]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                </Col>

                                <Col span={12}>
                                    <Form.Item
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        dependencies={["password"]}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (
                                                        !value ||
                                                        getFieldValue("password") === value
                                                    ) {
                                                        return Promise.resolve();
                                                    }

                                                    return Promise.reject(
                                                        new Error("Mật khẩu không khớp")
                                                    );
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="role"
                                label="Role"
                                rules={[{ required: true }]}
                            >
                                <Select
                                    placeholder="Select role"
                                    options={[
                                        {
                                            label: "Researcher",
                                            value: "RESEARCHER",
                                        },
                                        {
                                            label: "Lecturer",
                                            value: "LECTURER",
                                        },
                                        {
                                            label: "Student",
                                            value: "STUDENT",
                                        },
                                    ]}
                                />
                            </Form.Item>

                            <Button
                                htmlType="submit"
                                block
                                size="large"
                                className="signin-btn"
                            >
                                Create Account
                            </Button>

                            <div className="signup-link">
                                Already have an account?
                                <Link to="/login"> Sign In</Link>
                            </div>
                        </Form>

                    </div>
                </div>

                <div className="login-right">
                    <div className="slider-wrapper">
                        {images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt=""
                                className={
                                    currentImage === index
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

export default Register;