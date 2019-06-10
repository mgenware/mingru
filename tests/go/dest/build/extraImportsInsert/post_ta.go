package da

import (
	"github.com/mgenware/go-packagex/v5/dbx"
	"time"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// ------------ Actions ------------

// InsertTimes ...
func (da *TableTypePost) InsertTimes(queryable dbx.Queryable, datetime time.Time, nDatetime *time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `post` (`datetime`, `n_datetime`) VALUES (?, ?)", datetime, nDatetime)
	return dbx.GetLastInsertIDUint64WithError(result, err)
}
