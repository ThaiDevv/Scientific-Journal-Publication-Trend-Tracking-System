import axiosInstance from "./axiosConfig";

/**
 * Lấy danh sách bookmark của user hiện tại
 */
export const getMyBookmarks = (page = 0, size = 10) => {
    return axiosInstance.get("/bookmarks/me", {
        params: {
            page,
            size,
        },
    });
};

/**
 * Bookmark một bài báo
 */
export const addBookmark = (paperId) => {
    return axiosInstance.post("/bookmarks", {
        paperId,
    });
};

/**
 * Bỏ bookmark
 */
export const removeBookmark = (paperId) => {
    return axiosInstance.delete(`/bookmarks/${paperId}`);
};