package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertT ...
func (da *TableTypePost) InsertT(queryable dbx.Queryable, title string, userID uint64) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`, `content`) VALUES (?, ?, \"haha\")", title, userID)
	return err
}
