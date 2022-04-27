package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) UpdateTimes(mrQueryable mingru.Queryable, nDatetime *time.Time, nDate *time.Time, datetime time.Time) (int, error) {
	result, err := mrQueryable.Exec("UPDATE `db_post` SET `datetime` = ? WHERE `n_datetime` = ? OR `n_date` = ?", datetime, nDatetime, nDate)
	return mingru.GetRowsAffectedIntWithError(result, err)
}
