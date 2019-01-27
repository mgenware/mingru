import "github.com/mgenware/go-packagex/dbx"

// InsertT ...
func (da *TableTypePost) InsertT(queryable dbx.Queryable, postTitle string, postUserID uint64) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`, `content`) VALUES (?, ?, \"haha\")", postTitle, postUserID)
	return err
}
