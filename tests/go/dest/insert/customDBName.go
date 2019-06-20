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
func (da *TableTypePost) InsertT(queryable dbx.Queryable, title string, cmtCount uint) error {
	_, err := queryable.Exec("INSERT INTO `post` (`title`, `cmt_c`) VALUES (?, ?)", title, cmtCount)
	return err
}
