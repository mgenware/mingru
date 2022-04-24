package da

import (
	"time"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var PostAG = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) InsertTimes(mrQueryable mingru.Queryable, datetime time.Time, nDatetime *time.Time) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `db_post` (`datetime`, `n_datetime`) VALUES (?, ?)", datetime, nDatetime)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
