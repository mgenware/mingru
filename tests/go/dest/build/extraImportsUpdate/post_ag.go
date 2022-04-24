package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateNullableTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `n_datetime` = ?, `n_date` = ?", nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}

func (mrTable *PostAGType) UpdateTimes(mrQueryable mingru.Queryable, datetime time.Time, date time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `datetime` = ?, `date` = ?", datetime, date)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
