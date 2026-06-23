import { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Row,
    Col,
    Tag,
    Button,
    Empty,
    Spin,
    Pagination,
    Popconfirm,
    message,
} from "antd";

import { StarFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import {
    getMyBookmarks,
    removeBookmark,
} from "../api/bookmarkApi";

const { Title, Text } = Typography;

function Bookmarks() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [papers, setPapers] = useState([]);

    const [page, setPage] = useState(1);

    const pageSize = 10;

    const [total, setTotal] = useState(0);

    const loadBookmarks = async (currentPage = 1) => {

        try {

            setLoading(true);

            const res = await getMyBookmarks(currentPage - 1, pageSize);

            const body = res.data.body;

            setPapers(body.content);

            setTotal(body.totalElements);

        } catch {
            message.error("Không tải được danh sách bookmark");
        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        const init = async () => {
            await loadBookmarks(1);
        };

        init();
    }, []);

    const handleRemove = async (paperId) => {

        try {

            await removeBookmark(paperId);

            message.success("Đã bỏ bookmark");

            loadBookmarks(page);

        } catch {
            message.error("Bỏ bookmark thất bại");
        }

    };

    return (

        <div
            style={{
                padding: 24,
                maxWidth: 1400,
                margin: "0 auto",
            }}
        >

            <Title level={2}>
                📌 Bài báo đã lưu ({total})
            </Title>

            {
                loading ?

                    <div
                        style={{
                            textAlign: "center",
                            padding: 80,
                        }}
                    >
                        <Spin size="large" />
                    </div>

                    :

                    papers.length === 0 ?

                        <Empty
                            description="Bạn chưa lưu bài báo nào. Hãy tìm kiếm và lưu bài báo quan tâm!"
                        />

                        :

                        <>
                            {

                                papers.map((paper) => (

                                    <Card
                                        key={paper.id}
                                        style={{
                                            marginBottom: 16,
                                        }}
                                    >

                                        <Row justify="space-between">

                                            <Col flex="auto">

                                                <Title
                                                    level={4}
                                                    style={{
                                                        cursor: "pointer",
                                                        marginBottom: 8,
                                                    }}
                                                    onClick={() =>
                                                        navigate(`/papers/${paper.id}`)
                                                    }
                                                >
                                                    {paper.title}
                                                </Title>

                                                <div>
                                                    <Text>
                                                        {paper.authors?.join(", ")}
                                                    </Text>
                                                </div>

                                                <Text type="secondary">
                                                    {paper.journalName} • {paper.publicationYear}
                                                </Text>

                                                <div
                                                    style={{
                                                        marginTop: 10,
                                                    }}
                                                >
                                                    {
                                                        paper.keywords?.map((keyword) => (

                                                            <Tag key={keyword}>
                                                                {keyword}
                                                            </Tag>

                                                        ))
                                                    }
                                                </div>

                                            </Col>

                                            <Col>

                                                <Popconfirm
                                                    title="Bỏ bookmark?"
                                                    description="Bạn có chắc muốn bỏ lưu bài báo này?"
                                                    okText="Có"
                                                    cancelText="Không"
                                                    onConfirm={() =>
                                                        handleRemove(paper.id)
                                                    }
                                                >

                                                    <Button
                                                        danger
                                                        icon={<StarFilled />}
                                                    >
                                                        Bỏ lưu
                                                    </Button>

                                                </Popconfirm>

                                            </Col>

                                        </Row>

                                    </Card>

                                ))

                            }

                            <Pagination
                                current={page}
                                pageSize={pageSize}
                                total={total}
                                showSizeChanger={false}
                                onChange={(p) => {

                                    setPage(p);

                                    loadBookmarks(p);

                                }}
                                style={{
                                    marginTop: 24,
                                    textAlign: "center",
                                }}
                            />

                        </>

            }

        </div>

    );

}

export default Bookmarks;