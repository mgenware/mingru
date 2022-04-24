package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type TableTypePost struct {
}

var Post = &TableTypePost{}

// ------------ Actions ------------

func (mrTable *TableTypePost) UpdateNullableTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `n_datetime` = ?, `n_date` = ?", nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

func (mrTable *TableTypePost) UpdateTimes(mrQueryable mingru.Queryable, datetime time.Time, date time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `datetime` = ?, `date` = ?", datetime, date)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
