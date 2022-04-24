package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

func (mrTable *TableTypePost) DeleteTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) error {
	result, err := mrQueryable.Exec("DELETE FROM `db_post` WHERE `n_datetime` = ? OR `n_date` = ?", nDatetime, nDate)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
