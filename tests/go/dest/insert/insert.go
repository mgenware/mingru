import "github.com/mgenware/go-packagex/database/sqlx"

// InsertT ...
func (da *TableTypePost) InsertT(queryable sqlx.Queryable, postTitle string, postUserID uint64) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)", postTitle, postUserID)
	return err
}
