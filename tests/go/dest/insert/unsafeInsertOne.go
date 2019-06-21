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
func (da *TableTypePost) InsertT(queryable dbx.Queryable, title string, userID uint64) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`title`, `user_id`) VALUES (?, ?)", title, userID)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
