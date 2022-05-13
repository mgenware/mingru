package da

import (
	"fmt"

	"github.com/mgenware/mingru-go-lib"
)

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

const (
	PostAGSelectTOrderBy1N = iota
	PostAGSelectTOrderBy1Title
	PostAGSelectTOrderBy1CmtCount
)

const (
	PostAGSelectTOrderBy2N = iota
	PostAGSelectTOrderBy2Title
)

type PostAGSelectTResult struct {
	ID    uint64
	N     int
	Title string
}

func (mrTable *PostAGType) SelectT(mrQueryable mingru.Queryable, id uint64, orderBy1 int, orderBy1Desc bool, orderBy2 int, orderBy2Desc bool) ([]PostAGSelectTResult, error) {
	var orderBy1SQL string
	switch orderBy1 {
	case PostAGSelectTOrderBy1N:
		orderBy1SQL = "`n`"
	case PostAGSelectTOrderBy1Title:
		orderBy1SQL = "`title`"
	case PostAGSelectTOrderBy1CmtCount:
		orderBy1SQL = "`cmt_c`"
	default:
		err := fmt.Errorf("Unsupported value %v", orderBy1)
		return nil, err
	}
	if orderBy1Desc {
		orderBy1SQL += " DESC"
	}

	var orderBy2SQL string
	switch orderBy2 {
	case PostAGSelectTOrderBy2N:
		orderBy2SQL = "`n`"
	case PostAGSelectTOrderBy2Title:
		orderBy2SQL = "`title`"
	default:
		err := fmt.Errorf("Unsupported value %v", orderBy2)
		return nil, err
	}
	if orderBy2Desc {
		orderBy2SQL += " DESC"
	}

	rows, err := mrQueryable.Query("SELECT `id`, RAND() AS `n`, `title` FROM `db_post` WHERE `id` = ? ORDER BY `title`, "+orderBy1SQL+", "+orderBy2SQL, id)
	if err != nil {
		return nil, err
	}
	var result []PostAGSelectTResult
	defer rows.Close()
	for rows.Next() {
		var item PostAGSelectTResult
		err = rows.Scan(&item.ID, &item.N, &item.Title)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
