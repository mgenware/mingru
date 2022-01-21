package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (da *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// InsertTimes ...
func (da *TableTypePost) InsertTimes(queryable mingru.Queryable, datetime time.Time, nDatetime *time.Time) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO `db_post` (`datetime`, `n_datetime`) VALUES (?, ?)", datetime, nDatetime)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
