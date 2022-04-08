package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) InsertTimes(mrQueryable mingru.Queryable, datetime time.Time, nDatetime *time.Time) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `db_post` (`datetime`, `n_datetime`) VALUES (?, ?)", datetime, nDatetime)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}