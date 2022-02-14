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

func (mrTable *TableTypePost) UpdateTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time, datetime time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `datetime` = ? WHERE `n_datetime` = ? OR `n_date` = ?", datetime, nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
