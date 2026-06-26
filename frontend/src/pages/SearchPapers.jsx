import { useState, useEffect } from "react";
import {
    Input,
    Select,
    Button,
    Card,
    Tag,
    Pagination,
    Empty,
    Spin,
    Row,
    Col,
    Space,
    Typography,
    message,
} from "antd";

import {
    StarOutlined,
    StarFilled,
} from "@ant-design/icons";

import { useNavigate, useSearchParams } from "react-router-dom";

import { searchPapers } from "../api/paperApi";
import { getJournals } from "../api/journalApi";

import {
    addBookmark,
    removeBookmark,
    getMyBookmarks,
} from "../api/bookmarkApi";


const { Title, Text } = Typography;

function SearchPapers() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(false);

    const [papers, setPapers] = useState([]);

    const [journals, setJournals] = useState([]);

    const [bookmarkedIds, setBookmarkedIds] = useState([]);

    const [keyword, setKeyword] = useState("");

    const [author, setAuthor] = useState("");

    const [journalId, setJournalId] = useState();

    const [yearFrom, setYearFrom] = useState("");

    const [yearTo, setYearTo] = useState("");

    const [page, setPage] = useState(1);

    const pageSize = 10;

    const [total, setTotal] = useState(0);

    const [bookmarkCount, setBookmarkCount] = useState(0);

    const loadBookmarkCount = async () => {
        try {
            const res = await getMyBookmarks(0, 1);

            setBookmarkCount(res.data.body.totalElements);
        } catch (e) {
            console.error(e);
        }
    };

    async function loadBookmarks() {

        try {

            const res = await getMyBookmarks(0, 1000);

            const ids =
                res.data.body.content.map(item => item.id);

            setBookmarkedIds(ids);

        } catch (e) {

            console.log(e);

        }

    }

    async function loadJournals() {

        try {

            const res = await getJournals({
                page: 0,
                size: 100,
            });

            setJournals(
                res.data.body.content || []
            );

        } catch (e) {

            console.log(e);

        }

    }

    async function loadPapers(currentPage = 1, searchKeyword = keyword) {

        try {

            setLoading(true);

            const res = await searchPapers({

                keyword: searchKeyword,

                author,

                journalId,

                yearFrom,

                yearTo,

                page: currentPage - 1,

                size: pageSize,

                sortBy: "publicationYear",

                sortDir: "desc",

            });

            const body = res.data.body;

            setPapers(body.content);

            setTotal(body.totalElements);

        } catch (e) {

            message.error(
                e.response?.data?.message ||
                "Không tải được bài báo"
            );

        } finally {

            setLoading(false);

        }

    }
    useEffect(() => {

        const init = async () => {
            const urlKeyword = searchParams.get("keyword") || "";
            if (urlKeyword) {
                setKeyword(urlKeyword);
            }

            await loadBookmarks();

            await loadBookmarkCount();

            await loadJournals();

            await loadPapers(1, urlKeyword);

        };

        init();

    }, [searchParams]);
    const handleBookmark = async (paperId) => {

        try {

            if (bookmarkedIds.includes(paperId)) {

                await removeBookmark(paperId);

                setBookmarkedIds(prev =>
                    prev.filter(id => id !== paperId)
                );

                message.success("Đã bỏ bookmark");

            } else {

                await addBookmark(paperId);

                setBookmarkedIds(prev => [
                    ...prev,
                    paperId,
                ]);

                message.success("Đã bookmark");

            }

        } catch (e) {

            message.error(
                e.response?.data?.message ||
                "Bookmark thất bại"
            );

        }

    };
    const handleSearch = () => {
        setPage(1);
        loadPapers(1);
    };

    const handleReset = () => {

        setKeyword("");

        setAuthor("");

        setJournalId(undefined);

        setYearFrom("");

        setYearTo("");

        setPage(1);

        setTimeout(() => {
            loadPapers(1);
        }, 0);

    };

    const handlePageChange = (newPage) => {

        setPage(newPage);

        loadPapers(newPage);

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
                Search Papers
            </Title>

            <Input.Search
                size="large"
                placeholder="Tìm kiếm bài báo..."
                value={keyword}
                enterButton="Tìm kiếm"
                onChange={(e)=>setKeyword(e.target.value)}
                onSearch={handleSearch}
                style={{marginBottom:24}}
            />

            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">

                    <Col flex="auto">
                        <Input
                            placeholder="Author"
                            value={author}
                            onChange={(e)=>setAuthor(e.target.value)}
                        />
                    </Col>

                    <Col xs={24} md={6}>

                        <Select
                            allowClear
                            style={{width:"100%"}}
                            placeholder="Journal"
                            value={journalId}
                            onChange={setJournalId}
                            options={journals.map(j=>({
                                label:j.name,
                                value:j.id
                            }))}
                        />

                    </Col>

                    <Col xs={12} md={3}>
                        <Input
                            type="number"
                            placeholder="Year From"
                            value={yearFrom}
                            onChange={(e)=>setYearFrom(e.target.value)}
                        />
                    </Col>

                    <Col xs={12} md={3}>
                        <Input
                            type="number"
                            placeholder="Year To"
                            value={yearTo}
                            onChange={(e)=>setYearTo(e.target.value)}
                        />
                    </Col>

                    <Col xs={24} md={6}>
                        <Space wrap>
                            <Button
                                type="primary"
                                onClick={handleSearch}
                            >
                                Tìm kiếm
                            </Button>

                            <Button onClick={handleReset}>
                                Xóa bộ lọc
                            </Button>

                            <Button
                                type="default"
                                onClick={() => navigate("/bookmarks")}
                            >
                                📌 Bài báo đã lưu ({bookmarkCount})
                            </Button>
                        </Space>
                    </Col>

                </Row>

            </Card>

            <div style={{marginBottom:20}}>
                <Text strong>
                    Tìm thấy {total} bài báo
                </Text>
            </div>

            {
                loading ?

                    <div
                        style={{
                            textAlign:"center",
                            padding:80
                        }}
                    >
                        <Spin size="large"/>
                    </div>

                    :
                    papers.length===0 ?

                        <Empty
                            description="Không có bài báo"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />

                        :
                        <>
                            {papers.map((paper) => (

                                <Card key={paper.id} style={{ marginBottom: 16 }}>
                                    <Row justify="space-between" align="top" wrap={false}>

                                        <Col flex="auto">

                                            <Title
                                                level={4}
                                                style={{
                                                    marginBottom: 8,
                                                    cursor: "pointer",

                                                }}
                                                ellipsis={{ rows: 2 }}
                                                onClick={() => navigate(`/papers/${paper.id}`)}
                                            >
                                                {paper.title}
                                            </Title>

                                            <div style={{ marginBottom: 6 }}>
                                                <Text>
                                                    {paper.authorNames?.join(", ")}
                                                </Text>
                                            </div>

                                            <Text type="secondary">
                                                {paper.journalName} • {paper.publicationYear}
                                            </Text>

                                            <div style={{ marginTop: 10 }}>
                                                {paper.keywords?.map((keyword) => (
                                                    <Tag key={keyword}>
                                                        {keyword}
                                                    </Tag>
                                                ))}
                                            </div>

                                        </Col>

                                        <Col
                                            flex="130px"
                                            style={{
                                                marginLeft: 20,
                                                textAlign: "right",
                                            }}
                                        >

                                            <Button
                                                type="default"
                                                style={{
                                                    width: "100%",
                                                    whiteSpace: "nowrap",
                                                }}
                                                icon={
                                                    bookmarkedIds.includes(paper.id)
                                                        ? <StarFilled style={{ color: "#faad14" }} />
                                                        : <StarOutlined />
                                                }
                                                onClick={() => handleBookmark(paper.id)}
                                            >
                                                {bookmarkedIds.includes(paper.id)
                                                    ? "Đã lưu"
                                                    : "Bookmark"}
                                            </Button>

                                        </Col>

                                    </Row>
                                </Card>

                            ))}
                        </>
            }
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger={false}
                onChange={handlePageChange}
                style={{
                    marginTop: 24,
                    textAlign: "center",
                }}
            />
        </div>

    );

}

export default SearchPapers;