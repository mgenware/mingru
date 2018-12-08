import "github.com/mgenware/go-packagex/database/sqlx"

// InsertT ...
func (da *TableTypePost) InsertT(queryable sqlx.Queryable, title string, user_id uint64) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)", title, user_id)
	return err
}
